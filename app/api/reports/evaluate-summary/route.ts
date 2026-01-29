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
    const { report_id, summary_text, user_id } = await request.json()

    if (!report_id || !summary_text || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 获取原始报告内容
    const { data: report, error: reportError } = await supabase
      .from('industry_reports')
      .select('content, title')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // 使用 AI 评估摘要
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an English writing tutor evaluating a student's summary of an industry report.

Evaluate the summary based on:
1. Accuracy: Does it capture the key points of the original report?
2. Completeness: Are all major themes covered?
3. Conciseness: Is it appropriately brief without unnecessary details?
4. Language quality: Grammar, vocabulary, and sentence structure
5. Coherence: Does it flow logically?

Provide a score from 0-100 and constructive feedback in JSON format:
{
  "score": number,
  "strengths": ["point 1", "point 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "grammar_issues": ["issue 1", "issue 2"] (if any),
  "overall_feedback": "brief overall assessment"
}`
        },
        {
          role: 'user',
          content: `Original Report Title: ${report.title}

Original Report (excerpt):
${report.content.substring(0, 2000)}

Student's Summary:
${summary_text}

Please evaluate this summary.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = completion.choices[0].message.content || '{}'
    let feedback
    try {
      feedback = JSON.parse(aiResponse)
    } catch {
      feedback = {
        score: 70,
        overall_feedback: 'Summary received. Please try to be more specific in capturing key points.',
        strengths: [],
        improvements: []
      }
    }

    const score = feedback.score || 70
    const wordCount = summary_text.split(/\s+/).filter((w: string) => w.length > 0).length

    // 保存到数据库
    const { error: insertError } = await supabase
      .from('user_report_summaries')
      .upsert({
        user_id,
        report_id,
        summary_text,
        word_count: wordCount,
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
        has_written_summary: true,
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
