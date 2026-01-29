#!/usr/bin/env node

async function testTranslation() {
  console.log('🧪 Testing translation API...\n')

  const testText = 'Hello, welcome to the technical interview. Can you tell me about your most challenging project?'

  try {
    console.log('📝 Original text:')
    console.log(`   "${testText}"\n`)

    console.log('🔄 Translating...')

    const response = await fetch('http://localhost:3000/api/conversation/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    })

    const data = await response.json()

    if (data.success) {
      console.log('✅ Translation successful!\n')
      console.log('🇨🇳 Chinese translation:')
      console.log(`   "${data.translation}"\n`)
      console.log('✅ Translation feature is working!')
    } else {
      console.log('❌ Translation failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testTranslation()
