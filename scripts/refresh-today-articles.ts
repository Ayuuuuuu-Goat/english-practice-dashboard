// 刷新今日文章的脚本
// 使用方法: npx tsx scripts/refresh-today-articles.ts

import { createClient } from '@/lib/supabase'

async function refreshTodayArticles() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  console.log(`正在删除 ${today} 的文章缓存...`)

  const { data, error } = await supabase
    .from('daily_hn_stories')
    .delete()
    .eq('assigned_date', today)
    .select()

  if (error) {
    console.error('删除失败:', error)
    process.exit(1)
  }

  console.log(`✓ 成功删除 ${data?.length || 0} 篇文章`)
  console.log('现在刷新页面，系统会重新抓取今天的文章并获取完整内容！')
}

refreshTodayArticles()
