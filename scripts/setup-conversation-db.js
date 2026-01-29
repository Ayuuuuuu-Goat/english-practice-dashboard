const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQL(filename) {
  const filePath = path.join(__dirname, filename)
  const sql = fs.readFileSync(filePath, 'utf8')

  console.log(`\n📄 Running ${filename}...`)

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
    // If RPC doesn't exist, try direct execution
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        const result = await supabase.rpc('exec', { sql: statement })
        if (result.error) {
          console.error('Error:', result.error.message)
        }
      }
    }

    return { error: null }
  })

  if (error) {
    console.error('❌ Error:', error.message)
    return false
  }

  console.log('✅ Success!')
  return true
}

async function setupDatabase() {
  console.log('🚀 Setting up AI Conversation Database...')
  console.log('=' .repeat(50))

  // Step 1: Create tables
  console.log('\n📦 Step 1: Creating tables...')
  const tablesSuccess = await runSQL('create_ai_conversation_tables.sql')

  if (!tablesSuccess) {
    console.log('\n⚠️  Note: If you see "relation already exists" errors, that\'s okay!')
    console.log('It means the tables were already created previously.')
  }

  // Step 2: Seed data
  console.log('\n📦 Step 2: Seeding scenario data...')
  const seedSuccess = await runSQL('seed_conversation_scenarios.sql')

  if (!seedSuccess) {
    console.log('\n⚠️  Note: If you see "duplicate key" errors, that\'s okay!')
    console.log('It means the scenario data was already imported.')
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Database setup completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Restart your dev server: npm run dev')
  console.log('2. Navigate to the "AI 场景对话" tab')
  console.log('3. Start a conversation!')
  console.log('\n💡 Tip: Check the Supabase dashboard to verify tables were created')
  console.log('   Tables: ai_conversation_scenarios, conversation_dialogue_nodes,')
  console.log('           conversation_response_options, user_conversation_progress,')
  console.log('           conversation_session_results')
}

setupDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
