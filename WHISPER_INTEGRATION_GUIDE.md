import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * 使用本地Whisper-WebUI服务转录音频
 *
 * 需要先启动Whisper-WebUI: python app.py
 * 默认地址: http://localhost:7860
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { podcastId, whisperUrl = 'http://localhost:7860' } = body

    if (!podcastId) {
      return NextResponse.json({
        error: '请提供 podcastId'
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // 获取播客信息
    const { data: podcast, error } = await supabase
      .from('tech_podcasts')
      .select('*')
      .eq('id', podcastId)
      .single()

    if (error || !podcast) {
      return NextResponse.json({
        error: '播客不存在'
      }, { status: 404 })
    }

    console.log('🎤 开始转录音频:', podcast.title)
    console.log('音频URL:', podcast.audio_url)

    // 下载音频文件
    const audioResponse = await fetch(podcast.audio_url)
    if (!audioResponse.ok) {
      return NextResponse.json({
        error: '无法下载音频文件'
      }, { status: 500 })
    }

    const audioBlob = await audioResponse.blob()
    const audioBuffer = await audioBlob.arrayBuffer()

    // 调用Whisper-WebUI API
    // 注意：这需要Whisper-WebUI支持API调用
    // 或者你可以使用faster-whisper的Python脚本

    // 方案A: 如果Whisper-WebUI支持API
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer]), 'audio.mp3')
    formData.append('model', 'base') // tiny, base, small, medium, large
    formData.append('language', 'en')
    formData.append('task', 'transcribe')

    const whisperResponse = await fetch(`${whisperUrl}/transcribe`, {
      method: 'POST',
      body: formData
    })

    if (!whisperResponse.ok) {
      // 方案B: 保存音频到临时文件，使用Python脚本转录
      return await transcribeWithPythonScript(podcast, audioBuffer, supabase)
    }

    const transcription = await whisperResponse.json()

    // 更新数据库
    await supabase
      .from('tech_podcasts')
      .update({
        transcript: transcription.text,
        transcript_segments: transcription.segments || null
      })
      .eq('id', podcastId)

    console.log('✅ 转录完成')

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments: transcription.segments || null
    })

  } catch (error: any) {
    console.error('转录失败:', error)
    return NextResponse.json({
      error: '转录失败',
      message: error.message
    }, { status: 500 })
  }
}

// 使用Python脚本转录
async function transcribeWithPythonScript(
  podcast: any,
  audioBuffer: ArrayBuffer,
  supabase: any
) {
  const fs = require('fs').promises
  const { exec } = require('child_process')
  const path = require('path')
  const { promisify } = require('util')
  const execAsync = promisify(exec)

  try {
    // 保存音频到临时文件
    const tempDir = '/tmp/podcasts'
    await fs.mkdir(tempDir, { recursive: true })

    const audioPath = path.join(tempDir, `${podcast.id}.mp3`)
    await fs.writeFile(audioPath, Buffer.from(audioBuffer))

    console.log('音频已保存到:', audioPath)

    // 调用whisper命令行
    const { stdout } = await execAsync(
      `whisper "${audioPath}" --model base --language en --output_format json --output_dir "${tempDir}"`
    )

    console.log('Whisper输出:', stdout)

    // 读取转录结果
    const resultPath = path.join(tempDir, `${podcast.id}.json`)
    const resultData = await fs.readFile(resultPath, 'utf-8')
    const transcription = JSON.parse(resultData)

    // 更新数据库
    await supabase
      .from('tech_podcasts')
      .update({
        transcript: transcription.text,
        transcript_segments: transcription.segments || null
      })
      .eq('id', podcast.id)

    // 清理临时文件
    await fs.unlink(audioPath)
    await fs.unlink(resultPath)

    console.log('✅ 转录完成（Python脚本）')

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments: transcription.segments || null,
      method: 'python-script'
    })

  } catch (error: any) {
    console.error('Python脚本转录失败:', error)
    throw error
  }
}
