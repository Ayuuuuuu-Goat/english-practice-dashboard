#!/usr/bin/env node

const OpenAI = require('openai').default
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function testAPIKey() {
  console.log('🔑 Testing OpenAI API Key...\n')

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.log('❌ No API key found in .env.local')
    return
  }

  console.log(`API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`)

  const openai = new OpenAI({
    apiKey: apiKey,
    timeout: 30000,
  })

  try {
    console.log('\n📡 Sending test request to OpenAI...')

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello!"' }],
      max_tokens: 10,
    })

    console.log('✅ Success! API key is valid.')
    console.log(`Response: ${completion.choices[0].message.content}`)
    console.log('\n✅ OpenAI integration is working!')
  } catch (error) {
    console.log('❌ Failed:', error.message)

    if (error.code === 'invalid_api_key') {
      console.log('\n💡 The API key is invalid or expired.')
      console.log('   Get a new key at: https://platform.openai.com/api-keys')
    } else if (error.code === 'insufficient_quota') {
      console.log('\n💡 API quota exceeded.')
      console.log('   Check usage at: https://platform.openai.com/account/usage')
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Request timed out. This could be:')
      console.log('   - Network connectivity issues')
      console.log('   - Firewall blocking OpenAI API')
      console.log('   - OpenAI API experiencing issues')
    }
  }
}

testAPIKey()
