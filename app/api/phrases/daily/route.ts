import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '8')

    // 使用当前日期作为种子，每天获取不同的短语
    const today = new Date().toISOString().split('T')[0]
    const seed = today.split('-').join('') // 例如: 20260129

    let query = supabase
      .from('business_phrases')
      .select('*')
      .eq('is_active', true)

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query
      .order('order_index')
      .limit(limit * 3) // 获取更多然后随机选择

    if (error) throw error

    // 使用日期作为种子进行伪随机排序
    const shuffled = data?.sort((a, b) => {
      const hashA = (a.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const hashB = (b.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return hashA - hashB
    }) || []

    const dailyPhrases = shuffled.slice(0, limit)

    return NextResponse.json({
      success: true,
      phrases: dailyPhrases,
      date: today
    })
  } catch (error: any) {
    console.error('Error fetching daily phrases:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
