#!/usr/bin/env node

async function testAIChat() {
  console.log('🧪 Testing AI-powered conversation API...\n')

  const scenario = {
    id: 'test-id',
    scenario_type: 'interview',
    title: 'Technical Interview',
    description: 'Testing the AI conversation',
    initial_context: 'You are in an interview.'
  }

  console.log('1️⃣  Starting conversation...')
  try {
    const response = await fetch('http://localhost:3000/api/conversation/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: scenario,
        conversation_history: [],
        user_message: '[START_CONVERSATION]'
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log('   ✅ AI Response received!')
      console.log(`   AI says: "${data.ai_response.substring(0, 100)}..."`)
      console.log(`   Generated ${data.response_options?.length || 0} response options`)

      if (data.response_options && data.response_options.length > 0) {
        console.log('\n   Response options:')
        data.response_options.forEach((opt, i) => {
          console.log(`   ${i + 1}. [${opt.quality_score}pts] ${opt.option_text.substring(0, 60)}...`)
        })
      }

      console.log('\n✅ AI-powered conversation is working!')
      console.log('\n📝 Try it in the browser:')
      console.log('   1. Refresh your browser (Cmd+Shift+R)')
      console.log('   2. Go to "AI 场景对话" tab')
      console.log('   3. Click any scenario to start')
      console.log('   4. Watch as GPT-4 generates unique conversations!')
    } else {
      console.log('   ❌ Failed:', data.error)

      if (data.error?.includes('API key')) {
        console.log('\n💡 Make sure your OpenAI API key is valid in .env.local')
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   1. Server is running (npm run dev)')
    console.log('   2. OpenAI API key is set in .env.local')
    console.log('   3. You have internet connection for OpenAI API')
  }
}

testAIChat()
