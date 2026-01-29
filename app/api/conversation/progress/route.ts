import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { progress_id, selected_option_id, current_score } = await request.json()

    if (!progress_id || !selected_option_id) {
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

    // Get the selected option details
    const { data: selectedOption, error: optionError } = await supabase
      .from('conversation_response_options')
      .select('*, conversation_dialogue_nodes!inner(*)')
      .eq('id', selected_option_id)
      .single()

    if (optionError || !selectedOption) {
      console.error('Error fetching option:', optionError)
      return NextResponse.json(
        { success: false, error: 'Option not found' },
        { status: 404 }
      )
    }

    // Get current progress
    const { data: progress, error: progressError } = await supabase
      .from('user_conversation_progress')
      .select('*, ai_conversation_scenarios(*)')
      .eq('id', progress_id)
      .single()

    if (progressError || !progress) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json(
        { success: false, error: 'Progress not found' },
        { status: 404 }
      )
    }

    // Update conversation history
    const historyEntry = {
      node_id: progress.current_node_id,
      option_selected: selected_option_id,
      timestamp: new Date().toISOString()
    }

    const updatedHistory = [...(progress.conversation_history || []), historyEntry]

    // Check if next node is an ending node
    const nextNodeId = selectedOption.next_node_id
    const isEndingNode = ['success', 'neutral', 'fail', 'promotion', 'raise'].includes(nextNodeId)

    if (isEndingNode) {
      // Get the final node
      const { data: finalNode, error: finalNodeError } = await supabase
        .from('conversation_dialogue_nodes')
        .select('*')
        .eq('scenario_id', progress.scenario_id)
        .eq('node_id', nextNodeId)
        .single()

      if (finalNodeError) {
        console.error('Error fetching final node:', finalNodeError)
      }

      // Determine final outcome based on node_id
      let finalOutcome = 'neutral'
      if (nextNodeId === 'success' || nextNodeId === 'promotion') {
        finalOutcome = 'promotion'
      } else if (nextNodeId === 'raise') {
        finalOutcome = 'raise'
      } else if (nextNodeId === 'fail') {
        finalOutcome = 'failed'
      } else if (nextNodeId.includes('success')) {
        finalOutcome = 'deal_success'
      }

      // Calculate final scores
      const totalScore = current_score
      const grammarScore = Math.min(100, Math.floor((totalScore / 300) * 100) + 20)
      const expressionScore = Math.min(100, Math.floor((totalScore / 300) * 100) + 10)
      const outcomeScore = finalOutcome === 'promotion' || finalOutcome === 'raise' || finalOutcome === 'deal_success' ? 100 :
                          finalOutcome === 'neutral' ? 70 : 40

      // Complete the progress
      const { error: updateError } = await supabase
        .from('user_conversation_progress')
        .update({
          current_node_id: nextNodeId,
          conversation_history: updatedHistory,
          total_score: totalScore,
          is_completed: true,
          final_outcome: finalOutcome,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progress_id)

      if (updateError) {
        console.error('Error updating progress:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      // Create session result
      const { error: resultError } = await supabase
        .from('conversation_session_results')
        .insert({
          user_id: progress.user_id,
          scenario_id: progress.scenario_id,
          total_score: totalScore,
          grammar_score: grammarScore,
          expression_score: expressionScore,
          outcome_score: outcomeScore,
          final_outcome: finalOutcome,
          feedback_summary: `You completed the ${progress.ai_conversation_scenarios.title} scenario with a score of ${totalScore}.`,
          conversation_history: updatedHistory
        })

      if (resultError) {
        console.error('Error creating result:', resultError)
      }

      return NextResponse.json({
        success: true,
        is_completed: true,
        final_outcome: finalOutcome,
        final_node: finalNode,
        total_score: totalScore
      })
    } else {
      // Get next node
      const { data: nextNode, error: nextNodeError } = await supabase
        .from('conversation_dialogue_nodes')
        .select('*')
        .eq('scenario_id', progress.scenario_id)
        .eq('node_id', nextNodeId)
        .single()

      if (nextNodeError || !nextNode) {
        console.error('Error fetching next node:', nextNodeError)
        return NextResponse.json(
          { success: false, error: 'Next node not found' },
          { status: 404 }
        )
      }

      // Get response options for next node
      const { data: nextOptions, error: nextOptionsError } = await supabase
        .from('conversation_response_options')
        .select('*')
        .eq('node_id', nextNode.id)
        .order('quality_score', { ascending: false })

      if (nextOptionsError) {
        console.error('Error fetching next options:', nextOptionsError)
      }

      // Update progress
      const { error: updateError } = await supabase
        .from('user_conversation_progress')
        .update({
          current_node_id: nextNodeId,
          conversation_history: updatedHistory,
          total_score: current_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress_id)

      if (updateError) {
        console.error('Error updating progress:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        is_completed: false,
        next_node: nextNode,
        response_options: nextOptions || []
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
