import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAIRelatedStories } from '@/lib/hackernews/hn-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0]

    // 检查今天是否已经有文章
    const { data: existingStories, error: fetchError } = await supabase
      .from('daily_hn_stories')
      .select('*')
      .eq('assigned_date', today)
      .order('score', { ascending: false })

    if (fetchError) {
      console.error('Error fetching existing stories:', fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // 如果今天已经有文章，直接返回
    if (existingStories && existingStories.length > 0) {
      console.log(`Found ${existingStories.length} existing stories for today`)
      return NextResponse.json({
        success: true,
        stories: existingStories,
        fromCache: true,
      })
    }

    // 否则从 HN 抓取新文章
    console.log('Fetching new AI stories from Hacker News...')
    const hnStories = await getAIRelatedStories({
      maxStories: 10,
      hoursLimit24: 10,
    })

    if (hnStories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No AI-related stories found',
      }, { status: 404 })
    }

    // 使用 iframe 嵌入，不需要抓取内容
    console.log(`Processing ${hnStories.length} stories`)

    const processedStories = hnStories.map((story, index) => {
      console.log(`Story ${index + 1}: ${story.title}`)

      return {
        ...story,
        original_url: story.url || null,
        content_source: story.text ? 'hn_text' : (story.url ? 'iframe' : 'hn_text'),
        scrape_status: story.url ? 'iframe' : 'no_external',
        scraped_content: null,
        scraped_images: null,
        scrape_error: null,
        scraped_at: null,
      }
    })

    console.log(`Processed ${processedStories.length} stories`)

    // 检查哪些 hn_id 已经存在
    const hnIds = processedStories.map(s => s.id)
    const { data: existingIds } = await supabase
      .from('daily_hn_stories')
      .select('hn_id')
      .in('hn_id', hnIds)

    const existingHnIdSet = new Set(existingIds?.map(item => item.hn_id) || [])
    console.log(`Found ${existingHnIdSet.size} existing stories, will skip them`)

    // 过滤掉已存在的故事
    const newStories = processedStories.filter(story => !existingHnIdSet.has(story.id))

    if (newStories.length === 0) {
      console.log('All stories already exist in database')
      return NextResponse.json({
        success: true,
        stories: existingStories,
        fromCache: true,
        message: 'All stories already exist'
      })
    }

    console.log(`Inserting ${newStories.length} new stories`)

    // 保存到数据库
    const storiesToInsert = newStories.map(story => ({
      hn_id: story.id,
      title: story.title,
      url: story.url || null,
      text: story.text || null,
      score: story.score || 0,
      descendants: story.descendants || 0,
      author: story.by,
      posted_at: new Date(story.time * 1000).toISOString(),
      assigned_date: today,

      // 抓取相关字段（已经在 processedStories 中处理好了）
      original_url: story.original_url,
      content_source: story.content_source,
      scraped_content: story.scraped_content,
      scraped_images: story.scraped_images,
      scrape_status: story.scrape_status,
      scrape_error: story.scrape_error,
      scraped_at: story.scraped_at,
    }))

    const { data: insertedStories, error: insertError } = await supabase
      .from('daily_hn_stories')
      .insert(storiesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting stories:', insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    console.log(`Successfully inserted ${insertedStories?.length || 0} stories`)

    return NextResponse.json({
      success: true,
      stories: insertedStories,
      fromCache: false,
    })
  } catch (error: any) {
    console.error('Error in /api/hn/daily:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}
