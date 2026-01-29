#!/usr/bin/env node

/**
 * Simple database setup script for AI Conversation feature
 * This script uses the Supabase SQL Editor API to execute SQL files
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure the following are set in .env.local:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🚀 AI Conversation Feature - Database Setup')
console.log('=' .repeat(60))
console.log('\n📝 MANUAL SETUP INSTRUCTIONS:\n')
console.log('Since automated SQL execution requires additional setup,')
console.log('please follow these steps to set up the database:\n')

console.log('1️⃣  Open Supabase Dashboard:')
console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}\n`)

console.log('2️⃣  Go to SQL Editor (left sidebar)\n')

console.log('3️⃣  Run the first SQL file:')
console.log('   📄 File: scripts/create_ai_conversation_tables.sql')
console.log('   - Click "New Query"')
console.log('   - Copy and paste the content of this file')
console.log('   - Click "Run" or press Ctrl+Enter\n')

console.log('4️⃣  Run the second SQL file:')
console.log('   📄 File: scripts/seed_conversation_scenarios.sql')
console.log('   - Click "New Query" again')
console.log('   - Copy and paste the content of this file')
console.log('   - Click "Run" or press Ctrl+Enter\n')

console.log('5️⃣  Verify tables were created:')
console.log('   - Go to "Table Editor" in the sidebar')
console.log('   - You should see these new tables:')
console.log('     ✓ ai_conversation_scenarios')
console.log('     ✓ conversation_dialogue_nodes')
console.log('     ✓ conversation_response_options')
console.log('     ✓ user_conversation_progress')
console.log('     ✓ conversation_session_results\n')

console.log('6️⃣  Check scenario data:')
console.log('   - Open "ai_conversation_scenarios" table')
console.log('   - You should see 4 scenarios:')
console.log('     🎯 Technical Interview')
console.log('     👔 Team Meeting Discussion')
console.log('     📊 Project Status Report')
console.log('     🤝 Client Negotiation\n')

console.log('=' .repeat(60))
console.log('✅ Once completed, restart your dev server:')
console.log('   npm run dev\n')
console.log('Then navigate to the "AI 场景对话" tab to start using the feature!')
console.log('=' .repeat(60))

// Print file paths for convenience
console.log('\n📁 SQL File Locations:')
console.log(`   ${path.join(__dirname, 'create_ai_conversation_tables.sql')}`)
console.log(`   ${path.join(__dirname, 'seed_conversation_scenarios.sql')}`)

console.log('\n💡 Tip: You can also view these files in your code editor\n')
