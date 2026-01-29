#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  console.log('🔍 Checking database status...\n')

  // Check if scenarios table exists and has data
  const { data: scenarios, error } = await supabase
    .from('ai_conversation_scenarios')
    .select('*')
    .limit(5)

  if (error) {
    console.log('❌ Error querying scenarios table:', error.message)
    console.log('\n📝 The database tables have not been created yet.')
    console.log('\nPlease follow these steps:\n')
    printSetupInstructions()
    return false
  }

  if (!scenarios || scenarios.length === 0) {
    console.log('⚠️  Tables exist but no scenario data found.')
    console.log('\n📝 You need to run the seed script.')
    console.log('\nPlease follow step 4 in the setup instructions:\n')
    printSeedInstructions()
    return false
  }

  console.log(`✅ Found ${scenarios.length} scenarios in database:`)
  scenarios.forEach(s => {
    console.log(`   ${s.icon} ${s.title}`)
  })

  // Check dialogue nodes
  const { data: nodes, error: nodesError } = await supabase
    .from('conversation_dialogue_nodes')
    .select('*')
    .limit(1)

  if (nodesError || !nodes || nodes.length === 0) {
    console.log('\n⚠️  Scenarios exist but dialogue nodes are missing.')
    console.log('You may need to re-run the seed script.')
    printSeedInstructions()
    return false
  }

  console.log('✅ Dialogue nodes found')

  // Check response options
  const { data: options, error: optionsError } = await supabase
    .from('conversation_response_options')
    .select('*')
    .limit(1)

  if (optionsError || !options || options.length === 0) {
    console.log('\n⚠️  Dialogue nodes exist but response options are missing.')
    console.log('You may need to re-run the seed script.')
    printSeedInstructions()
    return false
  }

  console.log('✅ Response options found')
  console.log('\n🎉 Database is properly set up!')
  console.log('\nYou can now use the AI Conversation feature.')
  console.log('Refresh your browser and try starting a conversation.')
  return true
}

function printSetupInstructions() {
  console.log('1️⃣  Open Supabase SQL Editor:')
  console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}\n`)

  console.log('2️⃣  Click "New Query"\n')

  console.log('3️⃣  Copy and paste the content of this file:')
  console.log(`   scripts/create_ai_conversation_tables.sql\n`)

  console.log('4️⃣  Click "Run" (or press Ctrl+Enter)\n')

  console.log('5️⃣  Create another "New Query"\n')

  console.log('6️⃣  Copy and paste the content of this file:')
  console.log(`   scripts/seed_conversation_scenarios.sql\n`)

  console.log('7️⃣  Click "Run" (or press Ctrl+Enter)\n')

  console.log('8️⃣  Run this check script again:')
  console.log('   node scripts/check-and-fix-db.js\n')
}

function printSeedInstructions() {
  console.log('1️⃣  Open Supabase SQL Editor:')
  console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql')}\n`)

  console.log('2️⃣  Click "New Query"\n')

  console.log('3️⃣  Copy and paste the content of this file:')
  console.log(`   scripts/seed_conversation_scenarios.sql\n`)

  console.log('4️⃣  Click "Run" (or press Ctrl+Enter)\n')
}

checkDatabase().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
