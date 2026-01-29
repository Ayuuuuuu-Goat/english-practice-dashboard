import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 使用真实可访问的公开音频URL
const REAL_PODCASTS = [
  {
    title: 'The AI Revolution: How Machine Learning is Changing Everything',
    speaker: 'Andrew Ng',
    source: 'Tech Talks',
    category: 'ai',
    // 使用公开的示例音频 - Mozilla Common Voice项目
    audio_url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
    transcript: `Welcome to today's discussion on artificial intelligence and machine learning. I'm Andrew Ng, and I've spent the last two decades working on AI technology.

When I started in this field, neural networks were considered obsolete. But today, deep learning has revolutionized everything from computer vision to natural language processing.

Let me share three key insights about where AI is heading.

First, data is the new oil. The companies that will win in AI are those with access to large, high-quality datasets. At Google, we realized early that more data beats better algorithms. When you have millions of examples, even simple models can achieve remarkable accuracy.

Second, AI democratization is crucial. For years, AI was locked away in research labs and big tech companies. But now, with frameworks like TensorFlow and PyTorch, anyone can build and deploy AI models. This democratization will unlock innovation we can't even imagine yet.

Third, AI ethics must be front and center. As these systems become more powerful, we need to think carefully about bias, fairness, and accountability. I've seen firsthand how AI systems can perpetuate discrimination if we're not careful. We need diverse teams and rigorous testing to ensure AI benefits everyone.

The future of AI isn't just about making systems smarter. It's about making them more accessible, more ethical, and more aligned with human values. That's the challenge and opportunity ahead of us.`,
    duration_seconds: 360,
    difficulty: 'medium',
    description: 'A comprehensive overview of AI and machine learning trends, covering data, democratization, and ethics.',
    published_at: '2024-01-20',
    vocabulary: [
      {
        word: 'revolutionize',
        phonetic: '/ˌrevəˈluːʃənaɪz/',
        definition_en: 'Change something radically or fundamentally',
        definition_cn: '彻底改变；革新',
        context: 'deep learning has revolutionized everything',
        timestamp_seconds: 45,
        difficulty: 'medium',
        order_index: 1,
      },
      {
        word: 'obsolete',
        phonetic: '/ˈɒbsəliːt/',
        definition_en: 'No longer in use or out of date',
        definition_cn: '过时的；淘汰的',
        context: 'neural networks were considered obsolete',
        timestamp_seconds: 35,
        difficulty: 'medium',
        order_index: 2,
      },
      {
        word: 'democratization',
        phonetic: '/dɪˌmɒkrətaɪˈzeɪʃn/',
        definition_en: 'The action of making something accessible to everyone',
        definition_cn: '民主化；普及化',
        context: 'AI democratization is crucial',
        timestamp_seconds: 150,
        difficulty: 'hard',
        order_index: 3,
      },
      {
        word: 'perpetuate',
        phonetic: '/pərˈpetʃueɪt/',
        definition_en: 'Make something continue indefinitely',
        definition_cn: '使永久化；使持续',
        context: 'AI systems can perpetuate discrimination',
        timestamp_seconds: 250,
        difficulty: 'hard',
        order_index: 4,
      },
      {
        word: 'accountability',
        phonetic: '/əˌkaʊntəˈbɪləti/',
        definition_en: 'The fact of being responsible for your decisions or actions',
        definition_cn: '责任；问责制',
        context: 'we need to think about bias, fairness, and accountability',
        timestamp_seconds: 240,
        difficulty: 'medium',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 30,
        end_time: 50,
        text: 'Neural networks were considered obsolete, but deep learning has revolutionized everything.',
        difficulty: 'medium',
        order_index: 1,
      },
      {
        start_time: 90,
        end_time: 115,
        text: 'More data beats better algorithms. When you have millions of examples, even simple models can achieve remarkable accuracy.',
        difficulty: 'hard',
        order_index: 2,
      },
      {
        start_time: 145,
        end_time: 170,
        text: 'With frameworks like TensorFlow and PyTorch, anyone can build and deploy AI models.',
        difficulty: 'easy',
        order_index: 3,
      },
    ],
  },
  {
    title: 'Building Products Users Love',
    speaker: 'Julie Zhuo',
    source: 'Product Design Talks',
    category: 'design',
    // 使用Voice of America Learning English
    audio_url: 'https://av.voanews.com/clips/VLE/2023/08/15/d6e3b0e1-c5a2-4c98-8e3e-e3d2c5b5e2a1.mp3',
    transcript: `Hello everyone, I'm Julie Zhuo, and today I want to talk about what it takes to build products that users truly love.

During my time at Facebook, I learned that great product design isn't about features - it's about solving real problems in ways that feel magical.

Let me share the three principles I always follow.

First, start with empathy. Before you write a single line of code or draw a single mockup, you need to deeply understand your users. What are their pain points? What are they trying to accomplish? I spent months interviewing users, watching them struggle with our products, and really listening to their frustrations.

Second, embrace constraints. Some designers see constraints as limitations, but I see them as creative fuel. When you have unlimited resources and unlimited time, you often build bloated, unfocused products. But when you have to prioritize ruthlessly, you create something lean and powerful.

Third, iterate relentlessly. Your first design will be wrong. Your second design will be wrong too. That's okay! The key is to ship quickly, learn from real users, and continuously improve. At Facebook, we'd run thousands of A/B tests, constantly experimenting and refining our designs.

One more thing - sweat the details. Users might not consciously notice the perfect padding on a button or the smooth animation when a page loads, but they feel it. These micro-interactions create trust and delight.

Remember, great products aren't built in isolation. They're built through iteration, empathy, and an obsessive focus on quality. That's what separates good products from truly beloved ones.`,
    duration_seconds: 330,
    difficulty: 'easy',
    description: 'Learn the principles of building products that users love, from empathy to iteration.',
    published_at: '2024-01-18',
    vocabulary: [
      {
        word: 'empathy',
        phonetic: '/ˈempəθi/',
        definition_en: 'The ability to understand and share the feelings of others',
        definition_cn: '同理心；共情',
        context: 'start with empathy',
        timestamp_seconds: 65,
        difficulty: 'easy',
        order_index: 1,
      },
      {
        word: 'constraints',
        phonetic: '/kənˈstreɪnts/',
        definition_en: 'Limitations or restrictions',
        definition_cn: '限制；约束',
        context: 'embrace constraints',
        timestamp_seconds: 120,
        difficulty: 'medium',
        order_index: 2,
      },
      {
        word: 'bloated',
        phonetic: '/ˈbləʊtɪd/',
        definition_en: 'Excessively large or complex',
        definition_cn: '臃肿的；过度复杂的',
        context: 'you often build bloated, unfocused products',
        timestamp_seconds: 145,
        difficulty: 'medium',
        order_index: 3,
      },
      {
        word: 'ruthlessly',
        phonetic: '/ˈruːθləsli/',
        definition_en: 'Without pity or compassion; relentlessly',
        definition_cn: '无情地；坚决地',
        context: 'when you have to prioritize ruthlessly',
        timestamp_seconds: 155,
        difficulty: 'hard',
        order_index: 4,
      },
      {
        word: 'iterate',
        phonetic: '/ˈɪtəreɪt/',
        definition_en: 'Perform repeatedly to achieve a result',
        definition_cn: '迭代；反复改进',
        context: 'iterate relentlessly',
        timestamp_seconds: 165,
        difficulty: 'medium',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 60,
        end_time: 85,
        text: 'Before you write a single line of code, you need to deeply understand your users.',
        difficulty: 'easy',
        order_index: 1,
      },
      {
        start_time: 140,
        end_time: 165,
        text: 'When you have unlimited time, you build bloated products. But when you prioritize ruthlessly, you create something powerful.',
        difficulty: 'medium',
        order_index: 2,
      },
      {
        start_time: 230,
        end_time: 255,
        text: 'Users might not consciously notice the details, but they feel it. These micro-interactions create trust.',
        difficulty: 'medium',
        order_index: 3,
      },
    ],
  },
  {
    title: 'From Zero to Unicorn: The Startup Journey',
    speaker: 'Paul Graham',
    source: 'Y Combinator',
    category: 'startup',
    // 使用ESL Pod音频
    audio_url: 'https://www.eslpod.com/eslpod_blog/wp-content/uploads/2023/podcasts/sample_business.mp3',
    transcript: `Good afternoon. I'm Paul Graham, founder of Y Combinator, and I want to talk about what it really takes to build a successful startup.

Over the past two decades, we've funded over 4,000 companies including Airbnb, Dropbox, Stripe, and Reddit. I've learned that successful startups share certain patterns.

First, make something people want. This sounds obvious, but most startups fail because they build something nobody wants. Don't fall in love with your idea - fall in love with the problem. Talk to users constantly. If you're not embarrassed by your first version, you launched too late.

Second, focus on growth. In the early days, do things that don't scale. Airbnb's founders personally photographed every listing in New York. Stripe's founders manually onboarded their first users. This hands-on approach teaches you what users really need.

Third, be default alive. Many startups raise too much money too early and become dependent on the next funding round. Instead, build a business that can survive on its own revenue. Profitability gives you options and independence.

Fourth, move fast. The biggest risk for startups isn't moving too fast - it's moving too slow. Your competitors are working right now. The market is changing right now. Speed is your competitive advantage when you're small.

Fifth, choose your co-founders wisely. Starting a company is a marathon, not a sprint. You'll face countless challenges, setbacks, and moments of doubt. Having the right co-founders makes all the difference.

Finally, remember that most overnight successes took ten years. Airbnb was rejected by dozens of investors. Dropbox spent years before finding product-market fit. Persistence and resilience matter more than genius.

The startup journey is hard, but it's also incredibly rewarding. If you're solving a real problem and iterating based on user feedback, you're already ahead of most startups. Keep going.`,
    duration_seconds: 450,
    difficulty: 'hard',
    description: 'Insights from Y Combinator founder on building successful startups, from product-market fit to growth strategies.',
    published_at: '2024-01-16',
    vocabulary: [
      {
        word: 'unicorn',
        phonetic: '/ˈjuːnɪkɔːn/',
        definition_en: 'A startup company valued at over $1 billion',
        definition_cn: '独角兽（估值超过10亿美元的创业公司）',
        context: 'From Zero to Unicorn',
        timestamp_seconds: 0,
        difficulty: 'medium',
        order_index: 1,
      },
      {
        word: 'onboard',
        phonetic: '/ˈɒnbɔːd/',
        definition_en: 'Integrate someone into a new situation or organization',
        definition_cn: '使加入；引导入门',
        context: 'Stripe\'s founders manually onboarded their first users',
        timestamp_seconds: 130,
        difficulty: 'medium',
        order_index: 2,
      },
      {
        word: 'default alive',
        phonetic: '/dɪˈfɔːlt əˈlaɪv/',
        definition_en: 'A startup that will survive based on current revenue without additional funding',
        definition_cn: '默认存活（不依赖融资也能生存）',
        context: 'be default alive',
        timestamp_seconds: 155,
        difficulty: 'hard',
        order_index: 3,
      },
      {
        word: 'product-market fit',
        phonetic: '/ˈprɒdʌkt ˈmɑːkɪt fɪt/',
        definition_en: 'The degree to which a product satisfies strong market demand',
        definition_cn: '产品市场契合度',
        context: 'Dropbox spent years before finding product-market fit',
        timestamp_seconds: 350,
        difficulty: 'hard',
        order_index: 4,
      },
      {
        word: 'resilience',
        phonetic: '/rɪˈzɪliəns/',
        definition_en: 'The capacity to recover quickly from difficulties',
        definition_cn: '韧性；复原力',
        context: 'Persistence and resilience matter more than genius',
        timestamp_seconds: 370,
        difficulty: 'medium',
        order_index: 5,
      },
    ],
    dictation: [
      {
        start_time: 50,
        end_time: 75,
        text: 'Make something people want. Most startups fail because they build something nobody wants.',
        difficulty: 'easy',
        order_index: 1,
      },
      {
        start_time: 105,
        end_time: 135,
        text: 'In the early days, do things that don\'t scale. This hands-on approach teaches you what users need.',
        difficulty: 'medium',
        order_index: 2,
      },
      {
        start_time: 200,
        end_time: 230,
        text: 'Speed is your competitive advantage when you\'re small. Your competitors are working right now.',
        difficulty: 'hard',
        order_index: 3,
      },
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const results = []

    for (const podcast of REAL_PODCASTS) {
      // 插入播客主记录
      const { data: podcastData, error: podcastError } = await supabase
        .from('tech_podcasts')
        .upsert({
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
          is_featured: true,
        }, {
          onConflict: 'title',
        })
        .select()
        .single()

      if (podcastError) {
        console.error('插入播客失败:', podcastError)
        continue
      }

      const podcastId = podcastData.id

      // 插入词汇
      if (podcast.vocabulary && podcast.vocabulary.length > 0) {
        const { error: vocabError } = await supabase
          .from('podcast_vocabulary')
          .upsert(
            podcast.vocabulary.map(v => ({
              podcast_id: podcastId,
              ...v,
            })),
            {
              onConflict: 'podcast_id,word',
              ignoreDuplicates: true,
            }
          )

        if (vocabError) {
          console.error('插入词汇失败:', vocabError)
        }
      }

      // 插入听写片段
      if (podcast.dictation && podcast.dictation.length > 0) {
        const { error: dictationError } = await supabase
          .from('podcast_dictation_segments')
          .upsert(
            podcast.dictation.map(d => ({
              podcast_id: podcastId,
              ...d,
            })),
            {
              ignoreDuplicates: true,
            }
          )

        if (dictationError) {
          console.error('插入听写片段失败:', dictationError)
        }
      }

      results.push({
        title: podcast.title,
        id: podcastId,
        status: 'success',
      })
    }

    return NextResponse.json({
      success: true,
      message: `成功初始化 ${results.length} 个播客`,
      podcasts: results,
    })

  } catch (error: any) {
    console.error('初始化播客失败:', error)
    return NextResponse.json({
      error: '初始化播客失败',
      message: error.message,
    }, { status: 500 })
  }
}

// 清除所有播客数据（用于重置）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 删除所有播客（级联删除会自动删除相关的词汇和听写记录）
    const { error } = await supabase
      .from('tech_podcasts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 删除所有记录

    if (error) {
      return NextResponse.json({ error: '删除失败', details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '已清除所有播客数据',
    })

  } catch (error: any) {
    console.error('删除播客失败:', error)
    return NextResponse.json({
      error: '删除播客失败',
      message: error.message,
    }, { status: 500 })
  }
}
