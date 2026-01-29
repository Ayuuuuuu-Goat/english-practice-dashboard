#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate scenarios...\n')

  // Get all scenarios
  const { data: allScenarios } = await supabase
    .from('ai_conversation_scenarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (!allScenarios) {
    console.log('❌ Failed to fetch scenarios')
    return
  }

  console.log(`Found ${allScenarios.length} total scenarios`)

  // Group by scenario_type and keep only the most recent one
  const scenariosByType = {}
  const toDelete = []

  allScenarios.forEach(scenario => {
    if (!scenariosByType[scenario.scenario_type]) {
      // Keep the first one (most recent)
      scenariosByType[scenario.scenario_type] = scenario
      console.log(`✓ Keeping: ${scenario.icon} ${scenario.title} (${scenario.scenario_type})`)
    } else {
      // Mark for deletion
      toDelete.push(scenario.id)
      console.log(`✗ Will delete duplicate: ${scenario.icon} ${scenario.title}`)
    }
  })

  if (toDelete.length === 0) {
    console.log('\n✅ No duplicates found!')
    return
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} duplicate scenarios...`)

  for (const id of toDelete) {
    const { error } = await supabase
      .from('ai_conversation_scenarios')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(`   ❌ Failed to delete ${id}:`, error.message)
    } else {
      console.log(`   ✓ Deleted ${id}`)
    }
  }

  // Verify
  const { data: remaining } = await supabase
    .from('ai_conversation_scenarios')
    .select('*')

  console.log(`\n✅ Cleanup complete! ${remaining?.length || 0} scenarios remaining:\n`)
  remaining?.forEach(s => {
    console.log(`   ${s.icon} ${s.title} (${s.difficulty})`)
  })
}

cleanupDuplicates().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
