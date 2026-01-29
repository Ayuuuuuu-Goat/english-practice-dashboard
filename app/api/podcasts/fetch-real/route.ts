import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import Parser from 'rss-parser'

const parser = new Parser()

// 公开的技术播客RSS源
const PODCAST_FEEDS = [
  {
    url: 'https://feeds.simplecast.com/54nAGcIl', // The Changelog
    category: 'ai',
    difficulty: 'medium',
  },
  {
    url: 'https://changelog.com/podcast/feed', // The Changelog Podcast
    category: 'startup',
    difficulty: 'medium',
  },
  {
    url: 'https://feeds.pacific-content.com/acquired', // Acquired
    category: 'startup',
    difficulty: 'hard',
  },
]

interface PodcastEpisode {
  title: string
  speaker: string
  source: string
  category: string
  audio_url: string
  description: string
  duration_seconds: number
  published_at: string
  difficulty: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const episodes: PodcastEpisode[] = []

    // 从每个RSS源获取最新的播客
    for (const feed of PODCAST_FEEDS) {
      try {
        const rssFeed = await parser.parseURL(feed.url)

        // 获取最新的5集
        const latestEpisodes = rssFeed.items.slice(0, 5)

        for (const item of latestEpisodes) {
          // 查找音频URL
          const audioUrl = item.enclosure?.url || ''

          if (!audioUrl) continue

          // 计算时长（从iTunes duration或估算）
          let durationSeconds = 0
          if (item.itunes?.duration) {
            const duration = item.itunes.duration
            if (typeof duration === 'string') {
              const parts = duration.split(':').map(Number)
              if (parts.length === 3) {
                durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
              } else if (parts.length === 2) {
                durationSeconds = parts[0] * 60 + parts[1]
              } else {
                durationSeconds = parseInt(duration)
              }
            }
          }

          // 如果没有时长信息，默认30分钟
          if (!durationSeconds) {
            durationSeconds = 1800
          }

          const episode: PodcastEpisode = {
            title: item.title || 'Untitled Episode',
            speaker: item.creator || rssFeed.title || 'Unknown',
            source: rssFeed.title || 'Podcast',
            category: feed.category,
            audio_url: audioUrl,
            description: (item.contentSnippet || item.content || '').substring(0, 500),
            duration_seconds: durationSeconds,
            published_at: item.pubDate || new Date().toISOString(),
            difficulty: feed.difficulty,
          }

          episodes.push(episode)
        }
      } catch (error) {
        console.error(`Error parsing feed ${feed.url}:`, error)
        // 继续处理其他源
      }
    }

    if (episodes.length === 0) {
      return NextResponse.json({
        error: '未能获取任何播客',
        message: '所有RSS源都失败了'
      }, { status: 500 })
    }

    // 插入到数据库
    const { data, error } = await supabase
      .from('tech_podcasts')
      .upsert(
        episodes.map(ep => ({
          ...ep,
          transcript: 'Transcript will be generated...', // 稍后可以用Whisper API生成
        })),
        {
          onConflict: 'title',
          ignoreDuplicates: true
        }
      )
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: '数据库错误', details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      episodes: data
    })

  } catch (error: any) {
    console.error('获取播客失败:', error)
    return NextResponse.json({
      error: '获取播客失败',
      message: error.message
    }, { status: 500 })
  }
}

// 获取单个播客的详细信息（包括转录文本）
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const podcastId = searchParams.get('id')

    if (!podcastId) {
      return NextResponse.json({ error: '缺少播客ID' }, { status: 400 })
    }

    const { data: podcast, error } = await supabase
      .from('tech_podcasts')
      .select('*')
      .eq('id', podcastId)
      .single()

    if (error) {
      return NextResponse.json({ error: '获取播客失败' }, { status: 500 })
    }

    // 如果没有转录文本，这里可以调用Whisper API生成
    // 暂时返回现有数据
    return NextResponse.json({ podcast })

  } catch (error: any) {
    console.error('获取播客详情失败:', error)
    return NextResponse.json({
      error: '获取播客详情失败',
      message: error.message
    }, { status: 500 })
  }
}
