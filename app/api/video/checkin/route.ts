// API Route: 视频打卡

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// 用户视频打卡
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, video_id, watched_duration, completed, notes } = body

    if (!user_id || !video_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // 检查今天是否已打卡
    const { data: existingCheckin } = await supabase
      .from('user_video_checkins')
      .select('*')
      .eq('user_id', user_id)
      .eq('video_id', video_id)
      .eq('checkin_date', today)
      .single()

    if (existingCheckin) {
      // 更新现有打卡
      const { data: updatedCheckin, error: updateError } = await supabase
        .from('user_video_checkins')
        .update({
          watched_duration,
          completed,
          notes,
        })
        .eq('id', existingCheckin.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating checkin:', updateError)
        return NextResponse.json(
          { error: 'Failed to update checkin' },
          { status: 500 }
        )
      }

      // 更新统计（如果新标记为完成）
      if (completed && !existingCheckin.completed) {
        await updateUserStats(supabase, user_id, watched_duration)
      }

      return NextResponse.json({
        success: true,
        checkin: updatedCheckin,
        isNew: false,
      })
    }

    // 创建新打卡记录
    const { data: newCheckin, error: insertError } = await supabase
      .from('user_video_checkins')
      .insert({
        user_id,
        video_id,
        watched_duration,
        completed,
        notes,
        checkin_date: today,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating checkin:', insertError)
      return NextResponse.json(
        { error: 'Failed to create checkin' },
        { status: 500 }
      )
    }

    // 更新统计
    if (completed) {
      await updateUserStats(supabase, user_id, watched_duration)
    }

    return NextResponse.json({
      success: true,
      checkin: newCheckin,
      isNew: true,
    })
  } catch (error: any) {
    console.error('Error processing checkin:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// 更新用户统计
async function updateUserStats(
  supabase: any,
  userId: string,
  watchedDuration: number
) {
  const today = new Date().toISOString().split('T')[0]

  // 获取现有统计
  const { data: stats } = await supabase
    .from('user_video_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (stats) {
    // 计算连续天数
    let newStreak = stats.current_streak
    const lastCheckin = stats.last_checkin_date

    if (lastCheckin) {
      const lastDate = new Date(lastCheckin)
      const todayDate = new Date(today)
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1) {
        // 连续打卡
        newStreak += 1
      } else if (diffDays > 1) {
        // 中断了，重新开始
        newStreak = 1
      }
      // diffDays === 0 表示今天已经打卡过了，不增加streak
    } else {
      newStreak = 1
    }

    const newLongestStreak = Math.max(stats.longest_streak, newStreak)

    // 更新统计
    await supabase
      .from('user_video_stats')
      .update({
        total_videos_watched: stats.total_videos_watched + 1,
        total_watch_time: stats.total_watch_time + watchedDuration,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_checkin_date: today,
      })
      .eq('user_id', userId)
  } else {
    // 创建新统计
    await supabase.from('user_video_stats').insert({
      user_id: userId,
      total_videos_watched: 1,
      total_watch_time: watchedDuration,
      current_streak: 1,
      longest_streak: 1,
      last_checkin_date: today,
    })
  }
}

// 获取用户打卡状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const videoId = searchParams.get('video_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      )
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // 获取今日打卡记录
    let query = supabase
      .from('user_video_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)

    if (videoId) {
      query = query.eq('video_id', videoId)
    }

    const { data: checkins, error } = await query

    if (error) {
      console.error('Error fetching checkins:', error)
      return NextResponse.json(
        { error: 'Failed to fetch checkins' },
        { status: 500 }
      )
    }

    // 获取用户统计
    const { data: stats } = await supabase
      .from('user_video_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      success: true,
      checkins: checkins || [],
      stats: stats || null,
    })
  } catch (error: any) {
    console.error('Error getting checkin status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
