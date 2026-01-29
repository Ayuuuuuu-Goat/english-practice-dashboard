import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  timeout: 60000, // 60 seconds
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { scenario, conversation_history, user_message } = await request.json()

    if (!scenario || !user_message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build system prompt based on scenario
    const systemPrompt = getSystemPrompt(scenario)

    // Build conversation history for OpenAI
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.speaker === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: user_message }
    ]

    // Call OpenAI API (using gpt-3.5-turbo for faster responses)
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0].message.content || ''

    // Evaluate user's message
    const evaluation = await evaluateUserMessage(user_message, scenario, conversation_history)

    // Generate response options for next turn
    const responseOptions = await generateResponseOptions(aiResponse, scenario, conversation_history)

    // Check if conversation should end
    const shouldEnd = checkIfShouldEnd(conversation_history, evaluation.overall_score)

    return NextResponse.json({
      success: true,
      ai_response: aiResponse,
      evaluation: evaluation,
      response_options: responseOptions,
      should_end: shouldEnd,
      final_outcome: shouldEnd ? determineFinalOutcome(evaluation.overall_score) : null
    })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSystemPrompt(scenario: any): string {
  const basePrompt = `You are participating in an English conversation practice scenario: ${scenario.title}.

Scenario description: ${scenario.description}
Initial context: ${scenario.initial_context}
Your role: ${getCharacterRole(scenario.scenario_type)}

IMPORTANT INSTRUCTIONS:
1. Stay in character throughout the conversation
2. Ask relevant questions appropriate to the scenario
3. Respond naturally to the user's answers
4. Keep responses concise (2-4 sentences)
5. Gradually increase difficulty as conversation progresses
6. Continue the conversation naturally - do NOT end it prematurely
7. Keep asking follow-up questions to maintain the dialogue flow`

  return basePrompt
}

function getCharacterRole(scenarioType: string): string {
  const roles: { [key: string]: string } = {
    'interview': 'Technical Interviewer at a top tech company',
    'meeting': 'Manager/Boss discussing project roadmap',
    'reporting': 'Stakeholder reviewing project status',
    'negotiation': 'Client negotiating budget and scope'
  }
  return roles[scenarioType] || 'Professional colleague'
}

async function evaluateUserMessage(
  userMessage: string,
  scenario: any,
  conversationHistory: any[]
): Promise<any> {
  try {
    const evaluationPrompt = `Evaluate the quality of this response choice in a ${scenario.scenario_type} scenario:

Response chosen: "${userMessage}"

Provide evaluation in JSON format:
{
  "overall_score": <number 0-100>,
  "feedback": "<brief feedback explaining why this choice is good/bad in 1 sentence>"
}

Score criteria based on:
- Professionalism and appropriateness for the scenario
- Specificity and detail in the response
- Confidence and clarity
- Relevance to the conversation

Keep feedback encouraging and constructive.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: evaluationPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const evaluation = JSON.parse(completion.choices[0].message.content || '{}')
    return evaluation
  } catch (error) {
    console.error('Evaluation error:', error)
    return {
      overall_score: 70,
      feedback: 'Good choice! Keep going.'
    }
  }
}

async function generateResponseOptions(
  aiResponse: string,
  scenario: any,
  conversationHistory: any[]
): Promise<any[]> {
  try {
    const optionsPrompt = `Based on this ${scenario.scenario_type} scenario conversation:

AI just said: "${aiResponse}"

Generate 3 response options for the user in JSON format:
{
  "options": [
    {
      "option_text": "<response text>",
      "quality_level": "<excellent|good|poor>",
      "quality_score": <0-100>
    }
  ]
}

Requirements:
- Option 1 (Excellent, 90-100 points): Specific, professional, includes data/examples, confident tone
- Option 2 (Good, 60-75 points): Adequate response but less detailed or slightly less confident
- Option 3 (Poor, 20-40 points): Vague, too casual, uncertain, or off-topic
- All options must have correct grammar and natural English
- Each option should be 1-2 sentences
- Make them realistic choices someone might actually say`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: optionsPrompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"options": []}')
    return result.options || []
  } catch (error) {
    console.error('Options generation error:', error)
    return [
      { option_text: 'I understand. Let me think about that.', quality_level: 'good', quality_score: 70 },
      { option_text: 'Could you clarify what you mean?', quality_level: 'good', quality_score: 65 },
      { option_text: 'Um... okay.', quality_level: 'poor', quality_score: 30 }
    ]
  }
}

function checkIfShouldEnd(conversationHistory: any[], averageScore: number): boolean {
  // Never auto-end - let user decide when to finish
  // You can manually end the conversation by clicking the "结束对话" button
  return false
}

function determineFinalOutcome(averageScore: number): string {
  if (averageScore >= 85) return 'promotion' // or 'raise', 'deal_success'
  if (averageScore >= 65) return 'neutral'
  return 'failed'
}
