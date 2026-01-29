import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * 使用OpenAI Whisper API转录音频
 *
 * POST /api/podcasts/transcribe
 * Body: { podcastId: string } 或 { audioUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { podcastId, audioUrl } = body

    if (!podcastId && !audioUrl) {
      return NextResponse.json({
        error: '请提供 podcastId 或 audioUrl'
      }, { status: 400 })
    }

    const supabase = createServerClient()
    let targetAudioUrl = audioUrl

    // 如果提供了podcastId，获取音频URL
    if (podcastId) {
      const { data: podcast, error } = await supabase
        .from('tech_podcasts')
        .select('audio_url, title')
        .eq('id', podcastId)
        .single()

      if (error || !podcast) {
        return NextResponse.json({
          error: '播客不存在'
        }, { status: 404 })
      }

      targetAudioUrl = podcast.audio_url
    }

    if (!targetAudioUrl) {
      return NextResponse.json({
        error: '未找到音频URL'
      }, { status: 400 })
    }

    console.log('🎤 开始转录音频:', targetAudioUrl)

    // 调用OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: createFormData(targetAudioUrl)
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      console.error('Whisper API错误:', error)
      return NextResponse.json({
        error: 'Whisper转录失败',
        details: error
      }, { status: 500 })
    }

    const transcription = await whisperResponse.json()

    // 如果有podcastId，更新数据库
    if (podcastId && transcription.text) {
      await supabase
        .from('tech_podcasts')
        .update({
          transcript: transcription.text,
          // 如果API返回了时间戳信息，也保存
          transcript_segments: transcription.segments || null
        })
        .eq('id', podcastId)

      console.log('✅ 转录完成并已更新数据库')
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments: transcription.segments || null,
      language: transcription.language || 'en'
    })

  } catch (error: any) {
    console.error('转录失败:', error)
    return NextResponse.json({
      error: '转录失败',
      message: error.message
    }, { status: 500 })
  }
}

function createFormData(audioUrl: string): FormData {
  const formData = new FormData()

  // 注意：这里需要先下载音频文件，然后作为文件上传
  // 实际使用时，你可能需要：
  // 1. 下载音频到临时文件
  // 2. 或者使用 fetch(audioUrl) 获取 blob
  // 3. 然后添加到 FormData

  // 简化示例（实际需要实现文件下载逻辑）
  formData.append('file', audioUrl) // 这里需要是实际的文件
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json') // 获取时间戳信息
  formData.append('timestamp_granularities[]', 'segment')

  return formData
}

/**
 * 转录所有还没有完整转录文本的播客
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 获取所有需要转录的播客
    const { data: podcasts, error } = await supabase
      .from('tech_podcasts')
      .select('id, title, audio_url')
      .or('transcript.is.null,transcript.eq.')
      .limit(10)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: podcasts?.length || 0,
      podcasts: podcasts || []
    })

  } catch (error: any) {
    console.error('获取待转录播客失败:', error)
    return NextResponse.json({
      error: '获取失败',
      message: error.message
    }, { status: 500 })
  }
}
