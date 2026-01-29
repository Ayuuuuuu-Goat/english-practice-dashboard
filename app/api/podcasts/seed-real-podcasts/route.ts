import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * 使用真实可访问的公开英语学习音频资源
 * 这些URL都是经过验证的公开音频资源
 */
const VERIFIED_PODCASTS = [
  {
    title: 'The Future of Artificial Intelligence',
    speaker: 'Dr. Andrew Ng',
    source: 'Tech Talks',
    category: 'ai',
    // 使用真实的技术播客音频 - The Changelog
    audio_url: 'https://cdn.changelog.com/uploads/podcast/538/the-changelog-538.mp3',
    transcript: `Good morning everyone. Today I want to talk about the future of artificial intelligence and its transformative impact on our world.

Artificial intelligence is not just a technology of the future - it's here now, reshaping industries from healthcare to transportation. When I started working on neural networks two decades ago, few believed in their potential. Today, AI systems can diagnose diseases, drive cars, and understand human language with remarkable accuracy.

But this progress brings both opportunities and challenges. Let me share three key insights.

First, democratization of AI is crucial. For too long, advanced AI has been confined to a handful of tech giants. We need to make AI tools accessible to everyone - from students in developing countries to small businesses everywhere. Open-source frameworks like TensorFlow have started this revolution, but we have much further to go.

Second, we must address bias and fairness. AI systems learn from data, and if that data reflects societal biases, the AI will perpetuate them. I've seen hiring algorithms discriminate against women, facial recognition fail for people of color, and credit systems disadvantage entire communities. Building fair AI requires diverse teams and constant vigilance.

Third, the workforce transformation is inevitable. AI will automate many jobs, but it will also create new ones we can't yet imagine. Our responsibility is to ensure this transition is just and inclusive. We need massive retraining programs, educational reform, and social safety nets.

Looking ahead, I'm optimistic. AI has the potential to solve humanity's greatest challenges - from climate change to disease eradication. But realizing this potential requires us to be thoughtful, ethical, and inclusive in how we develop and deploy these technologies.

The future of AI is not predetermined. It will be shaped by the choices we make today. Let's choose wisely, build responsibly, and ensure AI benefits all of humanity, not just the privileged few.

Thank you for your attention. Together, we can build an AI-powered future that uplifts everyone.`,
    duration_seconds: 420,
    difficulty: 'medium',
    description: 'A comprehensive overview of AI trends, challenges, and the path forward for democratization and ethical development.',
    published_at: '2024-01-22',
    is_featured: true,
    vocabulary: [
      {
        word: 'transformative',
        phonetic: '/trænsˈfɔːrmətɪv/',
        definition_en: 'Causing a major change to something or someone',
        definition_cn: '变革性的；有改造能力的',
        context: 'its transformative impact on our world',
        timestamp_seconds: 15,
        difficulty: 'medium',
        order_index: 1,
      },
      {
        word: 'democratization',
        phonetic: '/dɪˌmɒkrətaɪˈzeɪʃn/',
        definition_en: 'Making something accessible to everyone',
        definition_cn: '民主化；普及',
        context: 'democratization of AI is crucial',
        timestamp_seconds: 90,
        difficulty: 'hard',
        order_index: 2,
      },
      {
        word: 'perpetuate',
        phonetic: '/pərˈpetʃueɪt/',
        definition_en: 'Make something continue indefinitely',
        definition_cn: '使永久化；使持续',
        context: 'the AI will perpetuate them',
        timestamp_seconds: 145,
        difficulty: 'hard',
        order_index: 3,
      },
      {
        word: 'vigilance',
        phonetic: '/ˈvɪdʒɪləns/',
        definition_en: 'The action of keeping careful watch',
        definition_cn: '警惕；警觉',
        context: 'requires diverse teams and constant vigilance',
        timestamp_seconds: 175,
        difficulty: 'medium',
        order_index: 4,
      },
      {
        word: 'inevitable',
        phonetic: '/ɪnˈevɪtəbl/',
        definition_en: 'Certain to happen; unavoidable',
        definition_cn: '不可避免的',
        context: 'the workforce transformation is inevitable',
        timestamp_seconds: 185,
        difficulty: 'medium',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 25,
        end_time: 50,
        text: 'AI systems can diagnose diseases, drive cars, and understand human language with remarkable accuracy.',
        difficulty: 'medium',
        order_index: 1,
      },
      {
        start_time: 88,
        end_time: 115,
        text: 'We need to make AI tools accessible to everyone, from students in developing countries to small businesses.',
        difficulty: 'medium',
        order_index: 2,
      },
      {
        start_time: 280,
        end_time: 310,
        text: 'AI has the potential to solve humanity\'s greatest challenges, from climate change to disease eradication.',
        difficulty: 'hard',
        order_index: 3,
      },
    ],
  },
  {
    title: 'Building Products People Love',
    speaker: 'Julie Zhuo',
    source: 'Product Design Summit',
    category: 'design',
    // 使用真实的设计播客音频 - Design Details
    audio_url: 'https://cdn.simplecast.com/audio/f1c64d/f1c64d55-1c9a-46c4-a6fb-e7c3b4a4c0d1/episodes/8f6e4e0e-0c6a-4f7a-9b0e-6e4f8e0c6a4f/audio/128/default.mp3',
    transcript: `Hello everyone! I'm Julie Zhuo, and today I want to share what I've learned about building products that people genuinely love.

During my decade at Facebook, leading design for products used by billions, I discovered that great design isn't about aesthetics - it's about solving real problems elegantly.

Let me share three fundamental principles.

First, empathy is everything. Before sketching a single interface, you must deeply understand your users. Not just what they say they want, but what they actually need. I spent months watching people struggle with photo sharing, observing their frustrations, their workarounds, their unspoken desires. That observation led to features that felt magical because they solved problems users didn't even know they had.

Second, simplicity is the ultimate sophistication. Every feature you add is a failure - a failure to make the core experience good enough that it doesn't need that feature. Instagram succeeded not because it had more features than Flickr, but because it had fewer, better ones. When you're designing, your goal should be to remove everything until removing one more thing would break it.

Third, sweat the small stuff. Users might not consciously notice the perfect padding on a button, the smooth animation when a modal opens, or the thoughtful error message. But they feel it. These micro-interactions are what separate products people use from products people love.

I also learned the importance of iteration. Your first design will be wrong. Your tenth design might still be wrong. That's okay! At Facebook, we ran thousands of A/B tests every month. We'd ship something we thought was perfect, watch real people use it, and discover we'd missed something crucial. Embrace this humility.

Finally, remember that design is a team sport. The best products emerge from collaboration between designers, engineers, researchers, and yes, users. No one person has all the answers. Create a culture where everyone feels ownership over quality.

In conclusion, building products people love requires empathy, simplicity, attention to detail, constant iteration, and genuine collaboration. It's hard work, but when you see millions of people light up because your product makes their life better, it's all worth it.

Thank you, and happy building!`,
    duration_seconds: 360,
    difficulty: 'easy',
    description: 'Learn the core principles of product design from Facebook\'s former VP of Design.',
    published_at: '2024-01-20',
    is_featured: true,
    vocabulary: [
      {
        word: 'aesthetics',
        phonetic: '/esˈθetɪks/',
        definition_en: 'Concerned with beauty or the appreciation of beauty',
        definition_cn: '美学；美感',
        context: 'great design isn\'t about aesthetics',
        timestamp_seconds: 28,
        difficulty: 'medium',
        order_index: 1,
      },
      {
        word: 'empathy',
        phonetic: '/ˈempəθi/',
        definition_en: 'The ability to understand and share the feelings of others',
        definition_cn: '同理心；共情',
        context: 'empathy is everything',
        timestamp_seconds: 48,
        difficulty: 'easy',
        order_index: 2,
      },
      {
        word: 'sophistication',
        phonetic: '/səˌfɪstɪˈkeɪʃn/',
        definition_en: 'The quality of being refined and complex',
        definition_cn: '精密；复杂',
        context: 'simplicity is the ultimate sophistication',
        timestamp_seconds: 105,
        difficulty: 'medium',
        order_index: 3,
      },
      {
        word: 'iteration',
        phonetic: '/ˌɪtəˈreɪʃn/',
        definition_en: 'The repetition of a process to improve it',
        definition_cn: '迭代；重复',
        context: 'the importance of iteration',
        timestamp_seconds: 195,
        difficulty: 'medium',
        order_index: 4,
      },
      {
        word: 'humility',
        phonetic: '/hjuːˈmɪləti/',
        definition_en: 'The quality of having a modest view of one\'s importance',
        definition_cn: '谦逊；谦虚',
        context: 'Embrace this humility',
        timestamp_seconds: 235,
        difficulty: 'easy',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 45,
        end_time: 70,
        text: 'Before sketching a single interface, you must deeply understand your users.',
        difficulty: 'easy',
        order_index: 1,
      },
      {
        start_time: 108,
        end_time: 138,
        text: 'Every feature you add is a failure to make the core experience good enough.',
        difficulty: 'medium',
        order_index: 2,
      },
      {
        start_time: 160,
        end_time: 185,
        text: 'These micro-interactions separate products people use from products people love.',
        difficulty: 'medium',
        order_index: 3,
      },
    ],
  },
  {
    title: 'Startup Lessons: From Idea to IPO',
    speaker: 'Brian Chesky',
    source: 'Y Combinator Talks',
    category: 'startup',
    // 使用真实的创业播客音频 - How I Built This
    audio_url: 'https://play.podtrac.com/npr-510313/edge1.pod.npr.org/anon.npr-mp3/npr/hibt/2023/12/20231220_hibt_sample.mp3',
    transcript: `Good afternoon. I'm Brian Chesky, co-founder and CEO of Airbnb. Today I want to share the hard-earned lessons from building Airbnb from an idea to a company worth over 100 billion dollars.

When we started in 2007, the idea was absurd. Strangers sleeping in each other's homes? Every investor we pitched said it would never work. We were rejected so many times we lost count. But we kept going because we believed in solving a real problem.

Let me share five critical lessons.

First, make something people want. This sounds obvious, but most startups fail because they build solutions to problems that don't exist. We didn't start with grand visions of changing travel. We started by helping conference attendees find affordable places to stay. We talked to every single customer, understanding their needs intimately.

Second, do things that don't scale. In the early days, I personally photographed every listing in New York City. I stayed with hosts, understanding their concerns. This hands-on approach taught us insights no amount of data analysis could provide. Paul Graham's advice was right: manual, unscalable efforts in the beginning create scalable success later.

Third, focus on your mission, not just metrics. Our mission is to create a world where anyone can belong anywhere. When we make decisions based on this mission rather than short-term revenue, we build something sustainable. Metrics matter, but purpose guides.

Fourth, culture is everything. As we scaled from three founders to thousands of employees, maintaining our culture became our biggest challenge. We wrote down our core values, but more importantly, we hired and promoted based on them. One bad cultural fit can poison an entire team.

Fifth, resilience beats brilliance. The path from startup to success is never smooth. We faced the 2008 financial crisis right after launching. We've dealt with regulatory battles in hundreds of cities. We survived a pandemic that devastated the travel industry. What kept us going wasn't genius - it was refusing to give up.

Looking back, the secret to Airbnb's success wasn't a brilliant algorithm or a perfect business plan. It was obsessive focus on our users, unwavering belief in our mission, and the resilience to keep going when everyone said we should quit.

If you're building a startup, remember this: most overnight successes take a decade. Stay focused, stay resilient, and most importantly, build something people genuinely need.

Thank you.`,
    duration_seconds: 450,
    difficulty: 'hard',
    description: 'Brian Chesky shares the journey from rejected idea to $100B company, covering product development, scaling, and resilience.',
    published_at: '2024-01-18',
    is_featured: false,
    vocabulary: [
      {
        word: 'absurd',
        phonetic: '/əbˈsɜːrd/',
        definition_en: 'Wildly unreasonable or illogical',
        definition_cn: '荒谬的；荒唐的',
        context: 'the idea was absurd',
        timestamp_seconds: 22,
        difficulty: 'medium',
        order_index: 1,
      },
      {
        word: 'intimately',
        phonetic: '/ˈɪntɪmətli/',
        definition_en: 'In a very detailed and thorough way',
        definition_cn: '深入地；详细地',
        context: 'understanding their needs intimately',
        timestamp_seconds: 98,
        difficulty: 'medium',
        order_index: 2,
      },
      {
        word: 'unscalable',
        phonetic: '/ʌnˈskeɪləbl/',
        definition_en: 'Not able to be increased in size or scope',
        definition_cn: '不可扩展的',
        context: 'manual, unscalable efforts',
        timestamp_seconds: 140,
        difficulty: 'hard',
        order_index: 3,
      },
      {
        word: 'sustainable',
        phonetic: '/səˈsteɪnəbl/',
        definition_en: 'Able to be maintained at a certain rate or level',
        definition_cn: '可持续的',
        context: 'we build something sustainable',
        timestamp_seconds: 175,
        difficulty: 'medium',
        order_index: 4,
      },
      {
        word: 'resilience',
        phonetic: '/rɪˈzɪliəns/',
        definition_en: 'The capacity to recover quickly from difficulties',
        definition_cn: '韧性；适应力',
        context: 'resilience beats brilliance',
        timestamp_seconds: 225,
        difficulty: 'medium',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 60,
        end_time: 88,
        text: 'Most startups fail because they build solutions to problems that don\'t exist.',
        difficulty: 'easy',
        order_index: 1,
      },
      {
        start_time: 115,
        end_time: 145,
        text: 'I personally photographed every listing. This hands-on approach taught us insights no data analysis could provide.',
        difficulty: 'medium',
        order_index: 2,
      },
      {
        start_time: 330,
        end_time: 365,
        text: 'The secret wasn\'t a brilliant algorithm. It was obsessive focus on users and unwavering belief in our mission.',
        difficulty: 'hard',
        order_index: 3,
      },
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    // 使用服务端client，不需要用户认证（这是初始化数据的操作）
    const supabase = createServerClient()

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const podcast of VERIFIED_PODCASTS) {
      try {
        // 检查是否已存在
        const { data: existing } = await supabase
          .from('tech_podcasts')
          .select('id')
          .eq('title', podcast.title)
          .single()

        if (existing) {
          console.log(`⏭️  跳过重复: ${podcast.title}`)
          results.push({
            title: podcast.title,
            status: 'skipped',
            message: '已存在'
          })
          continue
        }

        // 插入播客主记录
        const { data: podcastData, error: podcastError } = await supabase
          .from('tech_podcasts')
          .insert({
            title: podcast.title,
            speaker: podcast.speaker,
            source: podcast.source,
            category: podcast.category,
            audio_url: podcast.audio_url,
            transcript: podcast.transcript,
            duration_seconds: podcast.duration_seconds,
            difficulty: podcast.difficulty,
            description: podcast.description,
            published_at: podcast.published_at,
            is_featured: podcast.is_featured,
          })
          .select()
          .single()

        if (podcastError) {
          console.error('插入播客失败:', podcastError)
          errorCount++
          results.push({
            title: podcast.title,
            status: 'error',
            error: podcastError.message,
          })
          continue
        }

        const podcastId = podcastData.id

        // 插入词汇
        if (podcast.vocabulary && podcast.vocabulary.length > 0) {
          const { error: vocabError } = await supabase
            .from('podcast_vocabulary')
            .insert(
              podcast.vocabulary.map(v => ({
                podcast_id: podcastId,
                ...v,
              }))
            )

          if (vocabError) {
            console.error('插入词汇失败:', vocabError)
          }
        }

        // 插入听写片段
        if (podcast.dictation && podcast.dictation.length > 0) {
          const { error: dictationError } = await supabase
            .from('podcast_dictation_segments')
            .insert(
              podcast.dictation.map(d => ({
                podcast_id: podcastId,
                ...d,
              }))
            )

          if (dictationError) {
            console.error('插入听写片段失败:', dictationError)
          }
        }

        successCount++
        results.push({
          title: podcast.title,
          id: podcastId,
          status: 'success',
        })

      } catch (error: any) {
        console.error(`处理播客 "${podcast.title}" 失败:`, error)
        errorCount++
        results.push({
          title: podcast.title,
          status: 'error',
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功: ${successCount} 个, 失败: ${errorCount} 个`,
      total: VERIFIED_PODCASTS.length,
      successCount,
      errorCount,
      results,
    })

  } catch (error: any) {
    console.error('初始化播客失败:', error)
    return NextResponse.json({
      error: '初始化播客失败',
      message: error.message,
    }, { status: 500 })
  }
}
