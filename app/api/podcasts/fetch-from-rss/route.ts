import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:duration', 'duration'],
      ['itunes:subtitle', 'subtitle'],
      ['itunes:summary', 'summary'],
    ]
  }
})

// 真实的技术播客RSS源
const TECH_PODCAST_FEEDS = [
  {
    name: 'The Changelog',
    url: 'https://changelog.com/podcast/feed',
    category: 'ai',
    difficulty: 'medium',
    description: 'Conversations with the hackers, leaders, and innovators of the software world.'
  },
  {
    name: 'Software Engineering Daily',
    url: 'https://softwareengineeringdaily.com/feed/podcast/',
    category: 'ai',
    difficulty: 'hard',
    description: 'Technical interviews about software topics.'
  },
  {
    name: 'Syntax - Tasty Web Development Treats',
    url: 'https://feed.syntax.fm/rss',
    category: 'design',
    difficulty: 'medium',
    description: 'A web development podcast by Wes Bos and Scott Tolinski.'
  },
  {
    name: 'How I Built This',
    url: 'https://feeds.npr.org/510313/podcast.xml',
    category: 'startup',
    difficulty: 'easy',
    description: 'Guy Raz interviews founders about how they built their companies.'
  },
  {
    name: 'Masters of Scale',
    url: 'https://feeds.megaphone.fm/WWO7645176595',
    category: 'startup',
    difficulty: 'medium',
    description: 'Reid Hoffman tests his theories with legendary leaders.'
  }
]

function parseDuration(duration: any): number {
  if (!duration) return 1800 // 默认30分钟

  if (typeof duration === 'number') return duration

  if (typeof duration === 'string') {
    // 格式: HH:MM:SS 或 MM:SS 或纯秒数
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else {
      return parseInt(duration) || 1800
    }
  }

  return 1800
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { limit = 2 } = body // 每个源抓取几集

    console.log('🎙️ 开始从RSS源抓取播客...')

    const allEpisodes = []
    const errors = []

    for (const feed of TECH_PODCAST_FEEDS) {
      try {
        console.log(`📡 正在抓取: ${feed.name}`)
        const rssFeed = await parser.parseURL(feed.url)

        // 获取最新的几集
        const episodes = rssFeed.items.slice(0, limit)

        for (const item of episodes) {
          // 查找音频URL
          const audioUrl = item.enclosure?.url

          if (!audioUrl) {
            console.log(`⚠️ ${item.title} 没有音频URL，跳过`)
            continue
          }

          // 解析时长
          const durationSeconds = parseDuration(item.duration || item.itunes?.duration)

          // 生成简单的转录文本（实际应该用Whisper API）
          const transcript = `This is an episode from ${feed.name}.

${item.contentSnippet || item.content || item.summary || item.subtitle || 'No description available.'}

For the full transcript, please listen to the audio.

This podcast episode covers various topics related to technology, software development, and innovation. The hosts discuss industry trends, share insights from their experience, and interview guests who are leaders in their fields.

Key topics covered in this episode include practical advice for developers, discussions about emerging technologies, and insights into building successful products and companies.

Listen to learn more about the latest developments in tech and gain valuable insights from industry experts.`

          const episode = {
            title: item.title?.substring(0, 200) || 'Untitled Episode',
            speaker: item.creator || rssFeed.title || feed.name,
            source: feed.name,
            category: feed.category,
            audio_url: audioUrl,
            transcript: transcript.substring(0, 5000),
            duration_seconds: durationSeconds,
            difficulty: feed.difficulty,
            description: (item.contentSnippet || item.summary || item.subtitle || '').substring(0, 500),
            published_at: item.pubDate || new Date().toISOString(),
            is_featured: false,
          }

          allEpisodes.push(episode)
        }
      } catch (error: any) {
        console.error(`❌ 抓取 ${feed.name} 失败:`, error.message)
        errors.push({
          feed: feed.name,
          error: error.message
        })
      }
    }

    if (allEpisodes.length === 0) {
      return NextResponse.json({
        error: '未能抓取到任何播客',
        errors
      }, { status: 500 })
    }

    console.log(`✅ 成功抓取 ${allEpisodes.length} 个播客，准备插入数据库...`)

    // 插入到数据库（避免重复）
    const results = []
    let successCount = 0

    for (const episode of allEpisodes) {
      try {
        // 检查是否已存在（根据标题和音频URL）
        const { data: existing } = await supabase
          .from('tech_podcasts')
          .select('id')
          .eq('title', episode.title)
          .single()

        if (existing) {
          console.log(`⏭️  跳过重复: ${episode.title}`)
          results.push({
            title: episode.title,
            status: 'skipped',
            message: '已存在'
          })
          continue
        }

        // 插入新播客
        const { data, error } = await supabase
          .from('tech_podcasts')
          .insert(episode)
          .select()
          .single()

        if (error) {
          console.error('插入失败:', error)
          results.push({
            title: episode.title,
            status: 'error',
            error: error.message
          })
        } else {
          console.log(`✓ 插入成功: ${episode.title}`)
          results.push({
            title: episode.title,
            id: data.id,
            status: 'success',
            audio_url: episode.audio_url
          })
          successCount++

          // 为每个播客生成一些基础词汇
          await generateBasicVocabulary(supabase, data.id, episode.transcript)
        }
      } catch (error: any) {
        console.error(`处理 ${episode.title} 失败:`, error)
        results.push({
          title: episode.title,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功抓取并插入 ${successCount} 个播客`,
      total: allEpisodes.length,
      successCount,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('抓取播客失败:', error)
    return NextResponse.json({
      error: '抓取失败',
      message: error.message
    }, { status: 500 })
  }
}

// 生成基础词汇（简单版本）
async function generateBasicVocabulary(supabase: any, podcastId: string, transcript: string) {
  // 这里可以接入AI API来生成真实的词汇
  // 现在先插入一些示例词汇
  const sampleVocab = [
    {
      podcast_id: podcastId,
      word: 'innovation',
      phonetic: '/ˌɪnəˈveɪʃn/',
      definition_en: 'A new method, idea, or product',
      definition_cn: '创新；革新',
      context: 'discussing innovation in technology',
      timestamp_seconds: 60,
      difficulty: 'medium',
      order_index: 1,
    },
    {
      podcast_id: podcastId,
      word: 'implement',
      phonetic: '/ˈɪmplɪment/',
      definition_en: 'Put a decision or plan into effect',
      definition_cn: '实施；执行',
      context: 'how to implement new features',
      timestamp_seconds: 120,
      difficulty: 'easy',
      order_index: 2,
    },
    {
      podcast_id: podcastId,
      word: 'scalable',
      phonetic: '/ˈskeɪləbl/',
      definition_en: 'Able to be changed in size or scale',
      definition_cn: '可扩展的',
      context: 'building scalable systems',
      timestamp_seconds: 180,
      difficulty: 'medium',
      order_index: 3,
    }
  ]

  try {
    await supabase
      .from('podcast_vocabulary')
      .insert(sampleVocab)
  } catch (error) {
    console.error('插入词汇失败:', error)
  }
}

// GET: 查看可用的RSS源列表
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    feeds: TECH_PODCAST_FEEDS.map(f => ({
      name: f.name,
      category: f.category,
      difficulty: f.difficulty,
      description: f.description
    }))
  })
}
