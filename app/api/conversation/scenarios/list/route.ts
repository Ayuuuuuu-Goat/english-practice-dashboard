import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all scenarios
    const { data: scenarios, error } = await supabase
      .from('ai_conversation_scenarios')
      .select('*')
      .order('difficulty', { ascending: true })

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scenarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenarios: scenarios || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
