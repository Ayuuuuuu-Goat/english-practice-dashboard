import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { user_id, scenario_id } = await request.json()

    if (!user_id || !scenario_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the scenario's start node
    const { data: startNode, error: nodeError } = await supabase
      .from('conversation_dialogue_nodes')
      .select('*')
      .eq('scenario_id', scenario_id)
      .eq('node_id', 'start')
      .single()

    if (nodeError || !startNode) {
      console.error('Error fetching start node:', nodeError)
      return NextResponse.json(
        { success: false, error: 'Start node not found' },
        { status: 404 }
      )
    }

    // Get response options for the start node
    const { data: options, error: optionsError } = await supabase
      .from('conversation_response_options')
      .select('*')
      .eq('node_id', startNode.id)
      .order('quality_score', { ascending: false })

    if (optionsError) {
      console.error('Error fetching options:', optionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch options' },
        { status: 500 }
      )
    }

    // Create progress record
    const { data: progress, error: progressError } = await supabase
      .from('user_conversation_progress')
      .insert({
        user_id,
        scenario_id,
        current_node_id: startNode.node_id,
        conversation_history: [],
        total_score: 0,
        is_completed: false
      })
      .select()
      .single()

    if (progressError || !progress) {
      console.error('Error creating progress:', progressError)
      return NextResponse.json(
        { success: false, error: 'Failed to create progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress_id: progress.id,
      current_node: startNode,
      response_options: options || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
