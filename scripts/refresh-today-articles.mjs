// 刷新今日文章的脚本
// 使用方法: node scripts/refresh-today-articles.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请检查 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function refreshTodayArticles() {
  const today = new Date().toISOString().split('T')[0]

  console.log(`正在删除 ${today} 的文章缓存...`)

  // 首先获取今天的文章ID
  const { data: stories, error: fetchError } = await supabase
    .from('daily_hn_stories')
    .select('id')
    .eq('assigned_date', today)

  if (fetchError) {
    console.error('❌ 获取文章列表失败:', fetchError.message)
    process.exit(1)
  }

  if (!stories || stories.length === 0) {
    console.log('ℹ️  今天还没有缓存的文章')
    return
  }

  const storyIds = stories.map(s => s.id)
  console.log(`找到 ${storyIds.length} 篇文章`)

  // 删除相关的阅读记录
  console.log('正在删除相关的阅读记录...')
  const { error: readingsError } = await supabase
    .from('user_hn_readings')
    .delete()
    .in('story_id', storyIds)

  if (readingsError) {
    console.error('❌ 删除阅读记录失败:', readingsError.message)
    process.exit(1)
  }

  // 删除文章
  console.log('正在删除文章...')
  const { data, error } = await supabase
    .from('daily_hn_stories')
    .delete()
    .eq('assigned_date', today)
    .select()

  if (error) {
    console.error('❌ 删除文章失败:', error.message)
    process.exit(1)
  }

  console.log(`✅ 成功删除 ${data?.length || 0} 篇文章`)
  console.log('\n现在刷新页面 http://localhost:3000')
  console.log('系统会重新抓取今天的文章并获取完整内容！')
}

refreshTodayArticles()
