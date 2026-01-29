// API Route: 获取每日视频

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRandomDailyVideos } from '@/lib/youtube/youtube-api'

export const runtime = 'nodejs'

// 获取今日视频（如果不存在则创建）
export async function GET(request: NextRequest) {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0]

    // 检查今天是否已有视频（返回5-10个）
    const { data: existingVideos, error: fetchError } = await supabase
      .from('daily_videos')
      .select('*')
      .eq('assigned_date', today)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // 如果今天已有视频，直接返回
    if (existingVideos && existingVideos.length > 0) {
      return NextResponse.json({
        success: true,
        videos: existingVideos,
        isNew: false,
      })
    }

    // 今天没有视频，从YouTube获取新视频（5-10个）
    console.log('Fetching new videos from YouTube...')
    const categories = ['日常会话', '商务英语', '发音技巧'] as const
    const targetCount = Math.floor(Math.random() * 6) + 5 // 5-10个随机

    // 一次性获取多个不重复的视频
    const videos = await getRandomDailyVideos({
      apiKey: YOUTUBE_API_KEY,
      categories: categories,
      maxDuration: 900, // 15分钟
      count: targetCount,
    })

    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No suitable videos found' },
        { status: 404 }
      )
    }

    console.log(`Successfully fetched ${videos.length} unique videos`)

    // 批量保存到数据库
    const videosToInsert = videos.map(video => ({
      video_id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      channel_title: video.channelTitle,
      published_at: video.publishedAt,
      category: video.category,
      assigned_date: today,
      view_count: video.viewCount,
    }))

    const { data: newVideos, error: insertError } = await supabase
      .from('daily_videos')
      .insert(videosToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting videos:', insertError)
      return NextResponse.json(
        { error: 'Failed to save videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      videos: newVideos,
      isNew: true,
    })
  } catch (error: any) {
    console.error('Error getting daily video:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
