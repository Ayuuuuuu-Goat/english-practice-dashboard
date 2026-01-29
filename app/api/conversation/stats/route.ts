import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user_id' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get total sessions count
    const { count: totalCount, error: totalError } = await supabase
      .from('user_conversation_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (totalError) {
      console.error('Error fetching total count:', totalError)
    }

    // Get completed sessions count
    const { count: completedCount, error: completedError } = await supabase
      .from('user_conversation_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)

    if (completedError) {
      console.error('Error fetching completed count:', completedError)
    }

    // Get average score from completed sessions
    const { data: results, error: resultsError } = await supabase
      .from('conversation_session_results')
      .select('total_score')
      .eq('user_id', userId)

    let averageScore = 0
    if (!resultsError && results && results.length > 0) {
      const sum = results.reduce((acc, r) => acc + r.total_score, 0)
      averageScore = sum / results.length
    }

    // Get best outcome count (promotion, raise, deal_success)
    const { count: bestOutcomeCount, error: bestError } = await supabase
      .from('conversation_session_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('final_outcome', ['promotion', 'raise', 'deal_success'])

    if (bestError) {
      console.error('Error fetching best outcome count:', bestError)
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_sessions: totalCount || 0,
        completed_sessions: completedCount || 0,
        average_score: averageScore,
        best_outcome_count: bestOutcomeCount || 0
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
