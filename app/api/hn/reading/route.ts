import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: 获取用户的阅读记录和统计
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 获取今天的阅读记录
    const { data: readings, error: readingsError } = await supabase
      .from('user_hn_readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_date', today)

    if (readingsError) {
      console.error('Error fetching readings:', readingsError)
      return NextResponse.json({ success: false, error: readingsError.message }, { status: 500 })
    }

    // 获取或创建用户统计
    let { data: stats, error: statsError } = await supabase
      .from('user_hn_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code === 'PGRST116') {
      // 用户统计不存在，创建新记录
      const { data: newStats, error: createError } = await supabase
        .from('user_hn_stats')
        .insert({
          user_id: userId,
          total_stories_read: 0,
          current_streak: 0,
          longest_streak: 0,
          last_reading_date: null,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating stats:', createError)
        return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
      }

      stats = newStats
    } else if (statsError) {
      console.error('Error fetching stats:', statsError)
      return NextResponse.json({ success: false, error: statsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      readings: readings || [],
      stats: stats || {
        total_stories_read: 0,
        current_streak: 0,
        longest_streak: 0,
        last_reading_date: null,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/hn/reading:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}

// POST: 记录阅读打卡
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { user_id, story_id, read_completed, notes } = body

    if (!user_id || !story_id) {
      return NextResponse.json(
        { success: false, error: 'user_id and story_id are required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // 插入或更新阅读记录
    const { data: reading, error: readingError } = await supabase
      .from('user_hn_readings')
      .upsert({
        user_id,
        story_id,
        reading_date: today,
        read_completed: read_completed || false,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (readingError) {
      console.error('Error upserting reading:', readingError)
      return NextResponse.json({ success: false, error: readingError.message }, { status: 500 })
    }

    // 更新用户统计
    const { data: stats, error: statsError } = await supabase
      .from('user_hn_stats')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (stats && read_completed) {
      const lastDate = stats.last_reading_date ? new Date(stats.last_reading_date) : null
      const todayDate = new Date(today)

      let newStreak = stats.current_streak
      let newLongest = stats.longest_streak

      if (!lastDate) {
        // 第一次打卡
        newStreak = 1
      } else {
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 0) {
          // 同一天，连续天数不变
          newStreak = stats.current_streak
        } else if (daysDiff === 1) {
          // 连续打卡
          newStreak = stats.current_streak + 1
        } else {
          // 中断了，重新开始
          newStreak = 1
        }
      }

      // 更新最长连续天数
      if (newStreak > newLongest) {
        newLongest = newStreak
      }

      await supabase
        .from('user_hn_stats')
        .update({
          total_stories_read: stats.total_stories_read + 1,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_reading_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
    }

    return NextResponse.json({
      success: true,
      reading,
    })
  } catch (error: any) {
    console.error('Error in POST /api/hn/reading:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}
