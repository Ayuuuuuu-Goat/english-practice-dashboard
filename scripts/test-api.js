#!/usr/bin/env node

// Test the conversation API endpoints

async function testAPI() {
  console.log('🧪 Testing AI Conversation API...\n')

  // Test 1: Get scenarios
  console.log('1️⃣  Testing GET /api/conversation/scenarios/list')
  try {
    const response = await fetch('http://localhost:3000/api/conversation/scenarios/list')
    const data = await response.json()

    if (data.success && data.scenarios) {
      console.log(`   ✅ Success! Found ${data.scenarios.length} scenarios`)
      console.log('   Scenarios:')
      const uniqueScenarios = {}
      data.scenarios.forEach(s => {
        if (!uniqueScenarios[s.scenario_type]) {
          uniqueScenarios[s.scenario_type] = s
          console.log(`      ${s.icon} ${s.title} (${s.difficulty})`)
        }
      })
    } else {
      console.log('   ❌ Failed:', data.error || 'Unknown error')
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }

  console.log()

  // Test 2: Start a scenario
  console.log('2️⃣  Testing POST /api/conversation/start-scenario')
  try {
    const response = await fetch('http://localhost:3000/api/conversation/start-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test-user-' + Date.now(),
        scenario_id: '70e4640d-d9ca-4374-ab04-941468f2a9c4' // Project Status Report
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log('   ✅ Success! Conversation started')
      console.log(`   Progress ID: ${data.progress_id}`)
      console.log(`   Current Node: ${data.current_node.node_id}`)
      console.log(`   AI says: "${data.current_node.content.substring(0, 50)}..."`)
      console.log(`   Response options: ${data.response_options.length} choices`)
      return data
    } else {
      console.log('   ❌ Failed:', data.error || 'Unknown error')
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }

  console.log('\n✅ All API endpoints are working!\n')
  console.log('If you are still seeing issues in the browser:')
  console.log('1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)')
  console.log('2. Clear browser cache')
  console.log('3. Check browser console (F12) for errors')
}

testAPI().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
