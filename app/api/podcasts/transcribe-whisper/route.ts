import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

/**
 * 使用Whisper转录音频
 *
 * 方案1: 使用OpenAI API (需要OPENAI_API_KEY)
 * 方案2: 使用本地whisper命令行 (需要安装whisper)
 * 方案3: 使用faster-whisper (更快)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { podcastId, method = 'auto' } = body

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

    console.log('🎤 开始转录:', podcast.title)

    let result

    // 根据method选择转录方式
    if (method === 'openai' || (method === 'auto' && process.env.OPENAI_API_KEY)) {
      result = await transcribeWithOpenAI(podcast)
    } else if (method === 'local' || method === 'auto') {
      result = await transcribeWithLocalWhisper(podcast)
    } else {
      return NextResponse.json({
        error: '不支持的转录方法'
      }, { status: 400 })
    }

    // 更新数据库
    if (result.transcript) {
      await supabase
        .from('tech_podcasts')
        .update({
          transcript: result.transcript,
          transcript_segments: result.segments || null
        })
        .eq('id', podcastId)

      console.log('✅ 转录完成并已更新数据库')
    }

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('转录失败:', error)
    return NextResponse.json({
      error: '转录失败',
      message: error.message
    }, { status: 500 })
  }
}

// OpenAI API方式
async function transcribeWithOpenAI(podcast: any) {
  console.log('使用OpenAI Whisper API')

  // 下载音频
  const audioResponse = await fetch(podcast.audio_url)
  if (!audioResponse.ok) {
    throw new Error('无法下载音频文件')
  }

  const audioBlob = await audioResponse.blob()

  // 调用OpenAI API
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.mp3')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()

  return {
    transcript: data.text,
    segments: data.segments || null,
    language: data.language || 'en',
    method: 'openai'
  }
}

// 本地Whisper命令行方式
async function transcribeWithLocalWhisper(podcast: any) {
  console.log('使用本地Whisper命令行')

  // 创建临时目录
  const tempDir = '/tmp/podcasts'
  await mkdir(tempDir, { recursive: true })

  const audioPath = path.join(tempDir, `${podcast.id}.mp3`)
  const outputPath = path.join(tempDir, `${podcast.id}.json`)

  try {
    // 下载音频
    const audioResponse = await fetch(podcast.audio_url)
    if (!audioResponse.ok) {
      throw new Error('无法下载音频文件')
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    await writeFile(audioPath, Buffer.from(audioBuffer))

    console.log('音频已下载:', audioPath)

    // 运行whisper命令
    const { stdout, stderr } = await execAsync(
      `whisper "${audioPath}" --model base --language en --output_format json --output_dir "${tempDir}"`
    )

    console.log('Whisper stdout:', stdout)
    if (stderr) console.log('Whisper stderr:', stderr)

    // 读取结果
    const fs = await import('fs/promises')
    const resultData = await fs.readFile(outputPath, 'utf-8')
    const transcription = JSON.parse(resultData)

    // 清理临时文件
    await unlink(audioPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    return {
      transcript: transcription.text,
      segments: transcription.segments || null,
      language: transcription.language || 'en',
      method: 'local-whisper'
    }

  } catch (error: any) {
    // 清理临时文件
    await unlink(audioPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    throw new Error(`本地Whisper转录失败: ${error.message}`)
  }
}

/**
 * 批量转录所有播客
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 获取所有需要转录的播客
    const { data: podcasts, error } = await supabase
      .from('tech_podcasts')
      .select('id, title, audio_url, transcript')
      .or('transcript.is.null,transcript.eq.')

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: podcasts?.length || 0,
      message: `找到 ${podcasts?.length || 0} 个需要转录的播客`,
      podcasts: podcasts?.map(p => ({
        id: p.id,
        title: p.title
      }))
    })

  } catch (error: any) {
    console.error('获取待转录播客失败:', error)
    return NextResponse.json({
      error: '获取失败',
      message: error.message
    }, { status: 500 })
  }
}
