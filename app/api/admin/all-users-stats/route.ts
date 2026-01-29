import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { emailToUUID } from '@/lib/user-utils'

export async function GET(request: NextRequest) {
  try {
    // 使用 SERVICE_ROLE_KEY 查询所有用户数据
    const serverSupabase = createServerClient()

    console.log('Admin fetching all users stats...')

    // 查询所有用户的发音统计
    const { data: pronunciationStats, error: pError } = await serverSupabase
      .from('daily_practice_stats')
      .select('user_id, practice_date, completed_count, avg_total_score, total_duration_seconds')
      .order('practice_date', { ascending: false })

    if (pError) {
      console.error('Error fetching pronunciation stats:', pError)
    }

    // 查询视频统计
    const { data: videoStats, error: vError } = await serverSupabase
      .from('user_video_stats')
      .select('*')

    if (vError) {
      console.error('Error fetching video stats:', vError)
    }

    // 查询 HN 阅读统计
    const { data: hnStats, error: hError } = await serverSupabase
      .from('user_hn_stats')
      .select('*')

    if (hError) {
      console.error('Error fetching HN stats:', hError)
    }

    // 查询对话统计
    const { data: conversationResults, error: cError } = await serverSupabase
      .from('conversation_session_results')
      .select('user_id, total_score, created_at')

    if (cError) {
      console.error('Error fetching conversation results:', cError)
    }

    // 查询所有自定义角色
    const { data: customRoles, error: crError } = await serverSupabase
      .from('custom_roles')
      .select('name, email')

    if (crError) {
      console.error('Error fetching custom roles:', crError)
    }

    // 添加默认角色
    const defaultRoles = [
      { name: 'Viewer', email: 'viewer@example.com' }
    ]

    // 合并所有角色
    const allRoles = [...defaultRoles, ...(customRoles || [])]

    // 聚合数据按用户（使用角色的email来匹配数据）
    const aggregatedStats = aggregateByUser({
      roles: allRoles,
      pronunciationStats: pronunciationStats || [],
      videoStats: videoStats || [],
      hnStats: hnStats || [],
      conversationResults: conversationResults || []
    })

    return NextResponse.json({
      success: true,
      stats: aggregatedStats
    })

  } catch (error: any) {
    console.error('Error in admin API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

interface AggregateData {
  roles: any[]
  pronunciationStats: any[]
  videoStats: any[]
  hnStats: any[]
  conversationResults: any[]
}

function aggregateByUser(data: AggregateData) {
  const { roles, pronunciationStats, videoStats, hnStats, conversationResults } = data

  return roles.map(role => {
    const email = role.email
    const roleName = role.name
    const displayName = roleName.charAt(0).toUpperCase() + roleName.slice(1)
    // user_id字段存储的是从email生成的固定UUID
    const userId = emailToUUID(email)

    // 发音数据 - 通过user_id字段匹配UUID
    const userPronunciationStats = pronunciationStats.filter(s => s.user_id === userId)
    const totalPronunciationPractices = userPronunciationStats.reduce((sum, s) => sum + (s.completed_count || 0), 0)
    const avgPronunciationScore = userPronunciationStats.length > 0
      ? userPronunciationStats.reduce((sum, s) => sum + (s.avg_total_score || 0), 0) / userPronunciationStats.length
      : 0
    const totalPronunciationMinutes = userPronunciationStats.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) / 60

    // 视频数据
    const userVideoStat = videoStats.find(s => s.user_id === userId)
    const totalVideosWatched = userVideoStat?.total_videos_watched || 0
    const totalVideoMinutes = (userVideoStat?.total_watch_time || 0) / 60
    const videoStreak = userVideoStat?.current_streak || 0

    // HN 阅读数据
    const userHnStat = hnStats.find(s => s.user_id === userId)
    const totalHnStories = userHnStat?.total_stories_read || 0
    const hnStreak = userHnStat?.current_streak || 0

    // 对话数据
    const userConversations = conversationResults.filter(c => c.user_id === userId)
    const totalConversations = userConversations.length
    const avgConversationScore = userConversations.length > 0
      ? userConversations.reduce((sum, c) => sum + (c.total_score || 0), 0) / userConversations.length
      : 0

    // 计算总学习时长（分钟）
    const totalMinutes = totalPronunciationMinutes + totalVideoMinutes

    // 最后活跃时间
    const allDates = [
      ...userPronunciationStats.map(s => new Date(s.practice_date)),
      userVideoStat?.last_checkin_date ? new Date(userVideoStat.last_checkin_date) : null,
      userHnStat?.last_reading_date ? new Date(userHnStat.last_reading_date) : null,
      ...userConversations.map(c => new Date(c.created_at))
    ].filter(Boolean) as Date[]

    const lastActiveDate = allDates.length > 0
      ? new Date(Math.max(...allDates.map(d => d.getTime())))
      : null

    return {
      userId,
      email,
      roleName,
      displayName,

      // 综合统计
      totalMinutes: Math.round(totalMinutes),
      lastActiveDate: lastActiveDate?.toISOString() || null,

      // 各模块数据
      pronunciation: {
        totalPractices: totalPronunciationPractices,
        avgScore: Math.round(avgPronunciationScore * 10) / 10,
        totalMinutes: Math.round(totalPronunciationMinutes)
      },
      video: {
        totalWatched: totalVideosWatched,
        totalMinutes: Math.round(totalVideoMinutes),
        currentStreak: videoStreak
      },
      hn: {
        totalRead: totalHnStories,
        currentStreak: hnStreak
      },
      conversation: {
        totalSessions: totalConversations,
        avgScore: Math.round(avgConversationScore * 10) / 10
      }
    }
  })
}
