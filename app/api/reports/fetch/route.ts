import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
})

// RSS feeds to fetch from
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', category: 'tech' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
  { url: 'https://www.technologyreview.com/feed/', category: 'ai' },
  { url: 'https://blog.google/technology/ai/rss/', category: 'ai' },
  { url: 'https://openai.com/blog/rss.xml', category: 'ai' },
]

interface Article {
  title: string
  link: string
  content: string
  pubDate: Date
  source: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting report fetch...')

    // 1. Fetch articles from RSS feeds
    const articles = await fetchArticlesFromRSS()
    console.log(`📰 Fetched ${articles.length} articles`)

    if (articles.length === 0) {
      return NextResponse.json({ success: false, error: 'No articles fetched' })
    }

    // 2. Process each article
    const processed = []
    for (const article of articles.slice(0, 3)) { // Process top 3 articles
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('industry_reports')
          .select('id')
          .eq('source_url', article.link)
          .single()

        if (existing) {
          console.log(`⏭️  Skipping existing article: ${article.title}`)
          continue
        }

        // Generate enhanced content using AI
        const enhanced = await enhanceArticle(article)

        // Save to database
        const { data: report, error } = await supabase
          .from('industry_reports')
          .insert({
            title: article.title,
            category: getCategoryFromSource(article.source),
            source: article.source,
            source_url: article.link,
            content: enhanced.content,
            summary: enhanced.summary,
            difficulty: enhanced.difficulty,
            reading_time_minutes: enhanced.readingTime,
            published_at: article.pubDate,
            week_number: getWeekNumber(article.pubDate),
            year: article.pubDate.getFullYear(),
            is_featured: false,
          })
          .select()
          .single()

        if (error) {
          console.error('Error saving report:', error)
          continue
        }

        // Save vocabulary
        for (const vocab of enhanced.vocabulary) {
          await supabase.from('report_vocabulary').insert({
            report_id: report.id,
            ...vocab
          })
        }

        // Save discussion questions
        for (const question of enhanced.questions) {
          await supabase.from('report_discussion_questions').insert({
            report_id: report.id,
            ...question
          })
        }

        processed.push(report)
        console.log(`✅ Processed: ${article.title}`)
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      count: processed.length,
      reports: processed
    })
  } catch (error: any) {
    console.error('Fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function fetchArticlesFromRSS(): Promise<Article[]> {
  const articles: Article[] = []

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url)
      const xml = await response.text()

      // Parse RSS XML
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

      for (const item of items.slice(0, 5)) { // Top 5 from each feed
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || ''
        const pubDateStr = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

        if (title && link) {
          // Fetch full article content
          const fullContent = await fetchArticleContent(link)

          articles.push({
            title: title.trim(),
            link: link.trim(),
            content: fullContent || description,
            pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
            source: new URL(feed.url).hostname
          })
        }
      }
    } catch (error) {
      console.error(`Error fetching from ${feed.url}:`, error)
    }
  }

  return articles
}

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const html = await response.text()

    // Extract main content (simple version - could be improved)
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    if (articleMatch) {
      let content = articleMatch[1]
      // Remove HTML tags
      content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      content = content.replace(/<[^>]+>/g, ' ')
      content = content.replace(/\s+/g, ' ').trim()
      return content.slice(0, 10000) // Limit length
    }
    return ''
  } catch (error) {
    return ''
  }
}

async function enhanceArticle(article: Article) {
  // Use AI to enhance the article
  const prompt = `Analyze this article and provide:
1. A clean markdown version of the content (preserve main points, remove ads/navigation)
2. A 2-sentence summary
3. Reading difficulty (easy/medium/hard)
4. Estimated reading time in minutes
5. 5 key vocabulary words with definitions and example sentences
6. 3 discussion questions

Article Title: ${article.title}
Content: ${article.content.slice(0, 8000)}

Respond in JSON format:
{
  "content": "markdown content here",
  "summary": "brief summary",
  "difficulty": "easy|medium|hard",
  "readingTime": number,
  "vocabulary": [
    {
      "word": "word",
      "phonetic": "/phonetic/",
      "definition_en": "English definition",
      "definition_cn": "中文释义",
      "example_sentence": "Example sentence",
      "word_type": "noun|verb|adjective|adverb",
      "difficulty": "easy|medium|hard",
      "order_index": 1
    }
  ],
  "questions": [
    {
      "question": "Question text",
      "question_type": "open|analysis|opinion",
      "sample_answer": "Sample answer",
      "order_index": 1
    }
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  return result
}

function getCategoryFromSource(source: string): string {
  if (source.includes('openai') || source.includes('google') || source.includes('technologyreview')) {
    return 'ai'
  }
  return 'tech'
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
