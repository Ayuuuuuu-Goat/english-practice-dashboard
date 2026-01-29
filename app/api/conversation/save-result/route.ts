import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { user_id, scenario_id, total_score, turns, final_outcome, conversation_history } = await request.json()

    if (!user_id || !scenario_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate scores
    const avgScore = Math.round(total_score / turns)
    const grammarScore = Math.min(100, avgScore + 10)
    const expressionScore = Math.min(100, avgScore + 5)
    const outcomeScore = final_outcome === 'promotion' ? 100 : final_outcome === 'neutral' ? 70 : 40

    // Save session result
    const { error } = await supabase
      .from('conversation_session_results')
      .insert({
        user_id,
        scenario_id,
        total_score,
        grammar_score: grammarScore,
        expression_score: expressionScore,
        outcome_score: outcomeScore,
        final_outcome,
        feedback_summary: `Completed ${turns} turns with an average score of ${avgScore}/100`,
        conversation_history: conversation_history
      })

    if (error) {
      console.error('Error saving result:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save result' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
