import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  timeout: 60000,
})

export async function POST(request: NextRequest) {
  try {
    const { question_id, answer_text, report_id, user_id } = await request.json()

    if (!question_id || !answer_text || !report_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 获取问题详情
    const { data: question, error: questionError } = await supabase
      .from('report_discussion_questions')
      .select('question, question_type, sample_answer')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      )
    }

    // 使用 AI 评估回答
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an English discussion instructor evaluating a student's answer to a discussion question.

Evaluate the answer based on:
1. Relevance: Does it address the question directly?
2. Depth: Is the analysis thoughtful and well-developed?
3. Examples: Are concrete examples or evidence provided?
4. Language quality: Grammar, vocabulary, and clarity
5. Critical thinking: Does it show analytical skills?

Provide a score from 0-100 and feedback in JSON format:
{
  "score": number,
  "strengths": ["point 1", "point 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "language_feedback": "comment on language quality",
  "content_feedback": "comment on content and analysis"
}`
        },
        {
          role: 'user',
          content: `Discussion Question (${question.question_type}):
${question.question}

Sample Answer (for reference):
${question.sample_answer}

Student's Answer:
${answer_text}

Please evaluate this answer.`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const aiResponse = completion.choices[0].message.content || '{}'
    let feedback
    try {
      feedback = JSON.parse(aiResponse)
    } catch {
      feedback = {
        score: 70,
        content_feedback: 'Good effort. Try to develop your ideas more fully.',
        strengths: [],
        improvements: []
      }
    }

    const score = feedback.score || 70

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('user_discussion_answers')
      .upsert({
        user_id,
        report_id,
        question_id,
        answer_text,
        ai_feedback: feedback,
        score,
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Insert error:', insertError)
    }

    // 更新用户进度
    await supabase
      .from('user_report_progress')
      .upsert({
        user_id,
        report_id,
        has_answered_questions: true,
        last_read_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      score,
      feedback
    })
  } catch (error: any) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { success: false, error: 'Evaluation failed' },
      { status: 500 }
    )
  }
}
