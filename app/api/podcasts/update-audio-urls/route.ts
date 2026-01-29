import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * 更新播客的音频URL
 * POST body: { podcasts: [{ id: string, audio_url: string }] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { podcasts } = body

    if (!podcasts || !Array.isArray(podcasts)) {
      return NextResponse.json({
        error: '请提供播客数组: { podcasts: [{ id, audio_url }] }'
      }, { status: 400 })
    }

    const results = []

    for (const podcast of podcasts) {
      const { id, audio_url } = podcast

      if (!id || !audio_url) {
        results.push({ id, status: 'error', message: '缺少id或audio_url' })
        continue
      }

      const { error } = await supabase
        .from('tech_podcasts')
        .update({ audio_url })
        .eq('id', id)

      if (error) {
        results.push({ id, status: 'error', message: error.message })
      } else {
        results.push({ id, status: 'success', audio_url })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('更新音频URL失败:', error)
    return NextResponse.json({
      error: '更新失败',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * 获取所有播客的ID和当前音频URL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('tech_podcasts')
      .select('id, title, audio_url, category')
      .order('published_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      podcasts: data
    })

  } catch (error: any) {
    console.error('获取播客失败:', error)
    return NextResponse.json({
      error: '获取失败',
      message: error.message
    }, { status: 500 })
  }
}
