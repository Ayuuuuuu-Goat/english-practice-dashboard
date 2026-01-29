import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, quarter, year

    const serverSupabase = createServerClient()

    // 计算日期范围
    const now = new Date()
    const startDate = getStartDate(now, period)

    console.log(`Fetching timeline stats for period: ${period}, from ${startDate.toISOString()}`)

    // 查询发音练习数据
    const { data: pronunciationStats, error: pError } = await serverSupabase
      .from('daily_practice_stats')
      .select('user_id, practice_date, completed_count, avg_total_score, total_duration_seconds')
      .gte('practice_date', startDate.toISOString().split('T')[0])
      .order('practice_date', { ascending: true })

    if (pError) {
      console.error('Error fetching pronunciation stats:', pError)
    }

    // 查询对话数据
    const { data: conversationResults, error: cError } = await serverSupabase
      .from('conversation_session_results')
      .select('user_id, total_score, created_at')
      .gte('created_at', startDate.toISOString())

    if (cError) {
      console.error('Error fetching conversation results:', cError)
    }

    // 查询用户信息
    const { data: { users }, error: uError } = await serverSupabase.auth.admin.listUsers()

    if (uError) {
      console.error('Error fetching users:', uError)
    }

    // 生成时间序列数据
    const timelineData = generateTimelineData(
      period,
      startDate,
      now,
      pronunciationStats || [],
      conversationResults || [],
      users || []
    )

    return NextResponse.json({
      success: true,
      period,
      data: timelineData
    })

  } catch (error: any) {
    console.error('Error in timeline API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

function getStartDate(now: Date, period: string): Date {
  const date = new Date(now)

  switch (period) {
    case 'week':
      date.setDate(date.getDate() - 7)
      break
    case 'month':
      date.setMonth(date.getMonth() - 1)
      break
    case 'quarter':
      date.setMonth(date.getMonth() - 3)
      break
    case 'year':
      date.setFullYear(date.getFullYear() - 1)
      break
  }

  return date
}

function generateTimelineData(
  period: string,
  startDate: Date,
  endDate: Date,
  pronunciationStats: any[],
  conversationResults: any[],
  users: any[]
) {
  const timeline: any[] = []
  const current = new Date(startDate)

  // 根据周期确定时间间隔
  const interval = period === 'week' ? 1 : period === 'month' ? 1 : period === 'quarter' ? 7 : 30

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0]

    // 计算该日期的统计数据
    const dayStats = {
      date: dateKey,
      label: formatDateLabel(current, period),
      totalMinutes: 0,
      totalPractices: 0,
      avgScore: 0,
      totalConversations: 0,
      activeUsers: new Set()
    }

    // 聚合发音数据
    const dayPronunciation = pronunciationStats.filter(s => {
      const practiceDate = new Date(s.practice_date)
      return isSameDay(practiceDate, current)
    })

    dayPronunciation.forEach(s => {
      dayStats.totalMinutes += (s.total_duration_seconds || 0) / 60
      dayStats.totalPractices += s.completed_count || 0
      dayStats.avgScore += s.avg_total_score || 0
      dayStats.activeUsers.add(s.user_id)
    })

    if (dayPronunciation.length > 0) {
      dayStats.avgScore = dayStats.avgScore / dayPronunciation.length
    }

    // 聚合对话数据
    const dayConversations = conversationResults.filter(c => {
      const convDate = new Date(c.created_at)
      return isSameDay(convDate, current)
    })

    dayStats.totalConversations = dayConversations.length
    dayConversations.forEach(c => {
      dayStats.activeUsers.add(c.user_id)
    })

    timeline.push({
      ...dayStats,
      activeUsers: dayStats.activeUsers.size,
      totalMinutes: Math.round(dayStats.totalMinutes),
      avgScore: Math.round(dayStats.avgScore * 10) / 10
    })

    // 增加日期
    current.setDate(current.getDate() + interval)
  }

  return timeline
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

function formatDateLabel(date: Date, period: string): string {
  if (period === 'week') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else if (period === 'month') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else if (period === 'quarter') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else {
    return `${date.getFullYear()}/${date.getMonth() + 1}`
  }
}
