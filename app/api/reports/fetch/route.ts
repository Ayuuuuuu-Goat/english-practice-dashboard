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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    const html = await response.text()

    // Try multiple selectors to find main content
    const selectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ]

    let content = ''
    for (const selector of selectors) {
      const match = html.match(selector)
      if (match && match[1]) {
        content = match[1]
        break
      }
    }

    if (!content) {
      // Fallback: extract all paragraph text
      const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []
      content = paragraphs.join(' ')
    }

    // Clean up content
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    content = content.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    content = content.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    content = content.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    content = content.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')

    // Convert common HTML entities
    content = content.replace(/&nbsp;/g, ' ')
    content = content.replace(/&quot;/g, '"')
    content = content.replace(/&apos;/g, "'")
    content = content.replace(/&lt;/g, '<')
    content = content.replace(/&gt;/g, '>')
    content = content.replace(/&amp;/g, '&')

    // Remove all remaining HTML tags but preserve structure with newlines
    content = content.replace(/<\/p>/gi, '\n\n')
    content = content.replace(/<br[^>]*>/gi, '\n')
    content = content.replace(/<\/h[1-6]>/gi, '\n\n')
    content = content.replace(/<\/li>/gi, '\n')
    content = content.replace(/<[^>]+>/g, '')

    // Clean up whitespace
    content = content.replace(/\n{3,}/g, '\n\n')
    content = content.replace(/[ \t]+/g, ' ')
    content = content.trim()

    // Increase limit to 50000 characters (about 8000 words)
    return content.slice(0, 50000)
  } catch (error) {
    console.error('Error fetching article content:', error)
    return ''
  }
}

async function enhanceArticle(article: Article) {
  // Use AI to enhance the article
  const prompt = `Analyze this article and provide:
1. A clean, well-formatted markdown version of the COMPLETE content (preserve all main points, structure, and key details)
2. A 2-sentence summary
3. Reading difficulty (easy/medium/hard)
4. Estimated reading time in minutes
5. 5 key vocabulary words with definitions and example sentences
6. 3 discussion questions

Article Title: ${article.title}
Content: ${article.content.slice(0, 30000)}

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
