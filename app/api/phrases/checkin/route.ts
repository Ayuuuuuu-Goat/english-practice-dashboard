import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - 获取用户打卡记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 获取今天的打卡记录
    const { data: todayCheckin, error: todayError } = await supabase
      .from('phrase_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .single()

    // 获取最近7天的打卡记录
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentCheckins, error: recentError } = await supabase
      .from('phrase_checkins')
      .select('checkin_date, total_phrases')
      .eq('user_id', userId)
      .gte('checkin_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('checkin_date', { ascending: false })

    return NextResponse.json({
      success: true,
      todayCheckin: todayCheckin || null,
      recentCheckins: recentCheckins || [],
      hasCheckedInToday: !!todayCheckin
    })
  } catch (error: any) {
    console.error('Error fetching checkin:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - 创建/更新打卡记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, phrase_ids } = body

    if (!user_id || !phrase_ids) {
      return NextResponse.json({
        error: 'user_id and phrase_ids are required'
      }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 尝试更新现有记录
    const { data: existing } = await supabase
      .from('phrase_checkins')
      .select('*')
      .eq('user_id', user_id)
      .eq('checkin_date', today)
      .single()

    if (existing) {
      // 更新现有记录
      const updatedPhrases = Array.from(new Set([
        ...(existing.phrases_learned || []),
        ...phrase_ids
      ]))

      const { data, error } = await supabase
        .from('phrase_checkins')
        .update({
          phrases_learned: updatedPhrases,
          total_phrases: updatedPhrases.length
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        checkin: data,
        message: 'Checkin updated'
      })
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from('phrase_checkins')
        .insert({
          user_id,
          checkin_date: today,
          phrases_learned: phrase_ids,
          total_phrases: phrase_ids.length
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        checkin: data,
        message: 'Checkin created'
      })
    }
  } catch (error: any) {
    console.error('Error creating checkin:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
