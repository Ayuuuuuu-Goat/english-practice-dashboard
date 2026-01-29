import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 删除所有马叫音频的播客
    const { error: deleteError } = await supabase
      .from('tech_podcasts')
      .delete()
      .or('audio_url.like.%horse%,audio_url.like.%Epoq%,audio_url.like.%SoundHelix%')

    if (deleteError) {
      console.error('删除失败:', deleteError)
      return NextResponse.json({
        error: '删除失败',
        details: deleteError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '已删除所有马叫音频的播客数据'
    })

  } catch (error: any) {
    console.error('删除播客失败:', error)
    return NextResponse.json({
      error: '删除播客失败',
      message: error.message
    }, { status: 500 })
  }
}
