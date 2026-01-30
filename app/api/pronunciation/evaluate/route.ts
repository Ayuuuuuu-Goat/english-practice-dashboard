// API Route: 发音评测（使用科大讯飞API）
// 注意：使用Node.js runtime以支持WebSocket

import { NextRequest, NextResponse } from 'next/server'
import WebSocket from 'ws'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { parseStringPromise } from 'xml2js'

export const runtime = 'nodejs'

// 格式化评测文本
function formatEvaluationText(text: string, category: string, language: string): string {
  if (language === 'en') {
    // 英文评测需要特定格式
    if (category === 'read_word') {
      // 单词评测：需要[word]节点
      return `[word]\n${text}`
    } else if (category === 'read_sentence') {
      // 句子评测：需要[sentence]节点
      return `[sentence]\n${text}`
    } else if (category === 'read_chapter') {
      // 段落/章节评测：需要[chapter]节点
      return `[chapter]\n${text}`
    }
  } else {
    // 中文评测格式
    if (category === 'read_word') {
      return text // 中文单词可能需要不同格式
    } else if (category === 'read_chapter') {
      return `[chapter]\n${text}`
    }
  }

  return text
}

// 去除WAV文件头，提取PCM原始数据
function stripWavHeader(audioBuffer: Buffer): Buffer {
  // WAV文件格式检查
  if (audioBuffer.length < 44) {
    console.warn('Audio buffer too small, might not be a valid WAV file')
    return audioBuffer
  }

  // 检查是否是WAV文件 (RIFF标识)
  const header = audioBuffer.toString('ascii', 0, 4)
  if (header !== 'RIFF') {
    console.log('Not a WAV file (no RIFF header), using as-is')
    return audioBuffer
  }

  // 检查WAV格式标识
  const format = audioBuffer.toString('ascii', 8, 12)
  if (format !== 'WAVE') {
    console.warn('Not a standard WAV file')
    return audioBuffer
  }

  // 查找 "data" chunk
  let offset = 12
  while (offset < audioBuffer.length - 8) {
    const chunkId = audioBuffer.toString('ascii', offset, offset + 4)
    const chunkSize = audioBuffer.readUInt32LE(offset + 4)

    if (chunkId === 'data') {
      // 找到data chunk，返回PCM数据部分
      const pcmData = audioBuffer.slice(offset + 8, offset + 8 + chunkSize)
      console.log(`Stripped WAV header: ${offset + 8} bytes removed, PCM data: ${pcmData.length} bytes`)
      return pcmData
    }

    offset += 8 + chunkSize
  }

  // 如果没找到data chunk，返回去除前44字节的数据（标准WAV头大小）
  console.log('No data chunk found, removing standard 44-byte header')
  return audioBuffer.slice(44)
}

// 生成科大讯飞WebSocket URL（鉴权）
function getWebSocketUrl(params: {
  appId: string
  apiKey: string
  apiSecret: string
}): string {
  const { appId, apiKey, apiSecret } = params

  // 获取当前时间（RFC1123格式）
  const date = new Date().toUTCString()

  // 使用中国节点的正确路径
  const baseUrl = 'wss://ise-api.xfyun.cn/v2/open-ise'
  const host = 'ise-api.xfyun.cn'
  const requestLine = 'GET /v2/open-ise HTTP/1.1'

  // 拼接签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`

  console.log('Signature origin:', signatureOrigin)

  // 使用hmac-sha256加密
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64')

  console.log('Signature:', signature)

  // 拼接authorization
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')

  console.log('Authorization (first 50 chars):', authorization.substring(0, 50))

  // 使用URL类构建完整URL（避免手动编码问题）
  const url = new URL(baseUrl)
  url.searchParams.set('authorization', authorization)
  url.searchParams.set('date', date)
  url.searchParams.set('host', host)

  console.log('Final URL:', url.toString().substring(0, 150))

  return url.toString()
}

// 调用科大讯飞评测API
async function evaluateWithIFlyTek(params: {
  audioData: Buffer
  text: string
  language: 'en' | 'zh'
  category: string
  appId: string
  apiKey: string
  apiSecret: string
}): Promise<any> {
  const { audioData, text, language, category, appId, apiKey, apiSecret } = params

  const url = getWebSocketUrl({ appId, apiKey, apiSecret })

  console.log('Connecting to iFlyTek WebSocket...')

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    let result = ''
    let errorOccurred = false

    // 格式化评测文本
    const formattedText = formatEvaluationText(text, category, language)
    console.log('Formatted text for evaluation:', formattedText)

    // 第一帧：参数帧
    const paramsFrame = {
      common: {
        app_id: appId,
      },
      business: {
        category: category,
        sub: 'ise',
        ent: language === 'en' ? 'en_vip' : 'cn_vip',
        cmd: 'ssb',
        aue: 'raw',
        auf: 'audio/L16;rate=16000',
        ttp_skip: true,
        group: 'adult',
        text: '\uFEFF' + formattedText, // UTF-8 BOM + 格式化的文本
      },
      data: {
        status: 0, // 第一帧
      },
    }

    // 分块发送音频（使用较大块以提高速度，但不超过base64后的限制）
    // 最大：12000字节原始音频 ≈ 16000字节base64 < 26000限制
    // 这相当于 12000 / (16000 * 2) = 0.375秒音频/帧
    const CHUNK_SIZE = 12000
    const FRAME_INTERVAL = 20 // 帧间隔（毫秒）- 降低延迟
    const audioChunks: Buffer[] = []

    for (let i = 0; i < audioData.length; i += CHUNK_SIZE) {
      audioChunks.push(audioData.slice(i, i + CHUNK_SIZE))
    }

    console.log(`Audio size: ${audioData.length} bytes, will send in ${audioChunks.length} chunks`)

    ws.on('open', () => {
      console.log('WebSocket connected')
      // 先发送参数帧
      console.log('Sending params frame...')
      console.log('Params frame:', JSON.stringify(paramsFrame, null, 2))
      ws.send(JSON.stringify(paramsFrame))

      // 延迟发送音频帧
      let chunkIndex = 0
      const sendNextChunk = () => {
        if (chunkIndex >= audioChunks.length) {
          return
        }

        const chunk = audioChunks[chunkIndex]
        const isFirstChunk = chunkIndex === 0
        const isLastChunk = chunkIndex === audioChunks.length - 1

        // aus参数：1=第一帧，2=中间帧，4=最后一帧
        let aus: number
        if (audioChunks.length === 1) {
          // 只有一个块，直接标记为最后一帧
          aus = 4
        } else if (isFirstChunk) {
          aus = 1
        } else if (isLastChunk) {
          aus = 4
        } else {
          aus = 2
        }

        const audioFrame = {
          business: {
            cmd: 'auw',
            aus: aus,
          },
          data: {
            status: isLastChunk ? 2 : 1, // 1=继续，2=最后一帧
            data: chunk.toString('base64'),
          },
        }

        console.log(`Sending audio chunk ${chunkIndex + 1}/${audioChunks.length} (${chunk.length} bytes)`)
        ws.send(JSON.stringify(audioFrame))

        chunkIndex++

        if (!isLastChunk) {
          setTimeout(sendNextChunk, FRAME_INTERVAL)
        }
      }

      setTimeout(sendNextChunk, 20)
    })

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const response = JSON.parse(data.toString())
        console.log('iFlyTek response code:', response.code)

        if (response.code !== 0) {
          errorOccurred = true
          ws.close()
          reject(new Error(`iFlyTek API Error (${response.code}): ${response.message}`))
          return
        }

        if (response.data) {
          if (response.data.data) {
            console.log('Received result chunk, length:', response.data.data.length)
            result += response.data.data
          }
        }

        if (response.data && response.data.status === 2) {
          console.log('Received final frame, closing connection')
          ws.close()
        }
      } catch (error) {
        errorOccurred = true
        ws.close()
        reject(error)
      }
    })

    ws.on('close', () => {
      console.log('WebSocket closed')

      if (errorOccurred) {
        return
      }

      if (result) {
        try {
          console.log('Total result length:', result.length)
          console.log('Result first 100 chars:', result.substring(0, 100))

          const decodedResult = Buffer.from(result, 'base64').toString('utf-8')
          console.log('Decoded result length:', decodedResult.length)
          console.log('Decoded result first 200 chars:', decodedResult.substring(0, 200))

          // 解析 XML 结果
          parseXmlResult(decodedResult)
            .then((parsedResult) => {
              console.log('Parsed XML result successfully')
              resolve(parsedResult)
            })
            .catch((error) => {
              console.error('Error parsing XML:', error)
              reject(new Error('Failed to parse XML result: ' + error))
            })
        } catch (error) {
          console.error('Error details:', error)
          console.error('Result that failed to parse:', result)
          reject(new Error('Failed to parse result: ' + error))
        }
      } else {
        reject(new Error('No result received from iFlyTek'))
      }
    })

    ws.on('error', (error) => {
      errorOccurred = true
      console.error('WebSocket error:', error)
      reject(new Error('WebSocket connection failed: ' + error.message))
    })

    // 30秒超时
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        errorOccurred = true
        ws.close()
        reject(new Error('Request timeout'))
      }
    }, 30000)
  })
}

// 解析 XML 结果
async function parseXmlResult(xmlString: string): Promise<any> {
  try {
    const parsed = await parseStringPromise(xmlString, {
      explicitArray: false,
      mergeAttrs: true,
    })
    return parsed
  } catch (error) {
    console.error('Error parsing XML:', error)
    throw new Error('Failed to parse XML result')
  }
}

// 提取评分（处理 XML 结构）
function extractScores(result: any, language: 'en' | 'zh', category: string = 'read_word') {
  const scores = {
    total_score: 0,
    accuracy_score: 0,
    fluency_score: 0,
    integrity_score: 0,
    phone_score: 0,
    tone_score: 0,
  }

  try {
    console.log('Extracting scores from result:', JSON.stringify(result, null, 2).substring(0, 500))

    // XML 解析后的结构
    const xmlResult = result.xml_result
    if (!xmlResult) {
      console.error('No xml_result found in result')
      return scores
    }

    let dataNode = null

    // 根据评测类型获取不同的节点
    if (category === 'read_chapter') {
      // 章节评测
      const readChapter = xmlResult.read_chapter
      if (readChapter && readChapter.rec_paper && readChapter.rec_paper.read_chapter) {
        dataNode = readChapter.rec_paper.read_chapter
        console.log('Using read_chapter node')
      }
    } else if (category === 'read_sentence') {
      // 句子评测
      const readSentence = xmlResult.read_sentence
      if (readSentence && readSentence.rec_paper && readSentence.rec_paper.read_sentence) {
        dataNode = readSentence.rec_paper.read_sentence
        console.log('Using read_sentence node')
      }
    } else {
      // 单词评测（默认）
      const readWord = xmlResult.read_word
      if (readWord && readWord.rec_paper && readWord.rec_paper.read_word) {
        dataNode = readWord.rec_paper.read_word
        console.log('Using read_word node')
      }
    }

    if (!dataNode) {
      console.error('No evaluation data node found for category:', category)
      return scores
    }

    console.log('Evaluation data:', JSON.stringify(dataNode, null, 2).substring(0, 300))

    // 提取基础分数
    // 注意：科大讯飞语音评测API返回的分数范围需要根据实际情况判断
    // 通常评测返回的是0-100的分数，但某些参数配置下可能返回0-10
    const rawTotalScore = parseFloat(dataNode.total_score || 0)
    const rawAccuracyScore = parseFloat(dataNode.accuracy_score || 0)
    const rawFluencyScore = parseFloat(dataNode.fluency_score || 0)
    const rawIntegrityScore = parseFloat(dataNode.integrity_score || 0)

    console.log('Raw scores from iFlyTek:', {
      rawTotalScore,
      rawAccuracyScore,
      rawFluencyScore,
      rawIntegrityScore
    })

    // 自动判断分数范围：如果分数小于等于10，认为是0-10分制，需要乘以10
    // 否则认为是0-100分制，直接使用
    const isScaleOf10 = rawTotalScore <= 10 && rawTotalScore > 0
    const scoreMultiplier = isScaleOf10 ? 10 : 1

    scores.total_score = rawTotalScore * scoreMultiplier
    scores.accuracy_score = rawAccuracyScore * scoreMultiplier

    // 对于章节评测，科大讯飞可能直接返回流利度和完整度
    if (rawFluencyScore > 0) {
      scores.fluency_score = rawFluencyScore * scoreMultiplier
    } else {
      scores.fluency_score = scores.total_score * 0.95
    }

    if (rawIntegrityScore > 0) {
      scores.integrity_score = rawIntegrityScore * scoreMultiplier
    } else {
      scores.integrity_score = scores.total_score
    }

    console.log('Score scale detected:', isScaleOf10 ? '0-10' : '0-100')
    console.log('Final scores:', {
      total: scores.total_score,
      accuracy: scores.accuracy_score,
      fluency: scores.fluency_score,
      integrity: scores.integrity_score
    })

    // 音素分数：使用准确度分数
    scores.phone_score = scores.accuracy_score

    // 对于中文，添加声调分数
    if (language === 'zh') {
      scores.tone_score = scores.total_score * 0.9
    }
  } catch (error) {
    console.error('Error extracting scores:', error)
  }

  // 限制分数在0-100之间
  Object.keys(scores).forEach((key) => {
    scores[key as keyof typeof scores] = Math.max(0, Math.min(100, scores[key as keyof typeof scores]))
  })

  console.log('Extracted scores:', scores)
  return scores
}

// 主处理函数
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audio_url, text, language, category, user_id, word_card_id, duration } = body

    if (!audio_url || !text || !language || !category || !user_id || !word_card_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 从环境变量获取配置
    const IFLYTEK_APPID = process.env.IFLYTEK_APPID
    const IFLYTEK_API_KEY = process.env.IFLYTEK_API_KEY
    const IFLYTEK_API_SECRET = process.env.IFLYTEK_API_SECRET
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!IFLYTEK_APPID || !IFLYTEK_API_KEY || !IFLYTEK_API_SECRET) {
      return NextResponse.json(
        { error: 'iFlyTek credentials not configured' },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    console.log('Downloading audio from:', audio_url)
    const audioResponse = await fetch(audio_url)

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file')
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer()
    const audioBuffer = Buffer.from(audioArrayBuffer)
    console.log('Audio downloaded, size:', audioBuffer.length)

    // 去除WAV头部，提取PCM数据
    const pcmData = stripWavHeader(audioBuffer)
    console.log('PCM data size:', pcmData.length)

    console.log('Calling iFlyTek API...')
    const result = await evaluateWithIFlyTek({
      audioData: pcmData,
      text,
      language,
      category,
      appId: IFLYTEK_APPID,
      apiKey: IFLYTEK_API_KEY,
      apiSecret: IFLYTEK_API_SECRET,
    })

    console.log('iFlyTek result received')

    const scores = extractScores(result, language, category)

    // 保存到数据库
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: attempt, error: dbError } = await supabase
      .from('pronunciation_attempts')
      .insert({
        user_id,
        word_card_id,
        audio_url,
        total_score: scores.total_score,
        accuracy_score: scores.accuracy_score,
        fluency_score: scores.fluency_score,
        integrity_score: scores.integrity_score,
        phone_score: scores.phone_score,
        tone_score: scores.tone_score,
        raw_result: result,
        practice_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // 即使数据库保存失败，也返回评分结果
    }

    // 更新每日统计 - 即使 attempt 保存失败也要更新统计
    const today = new Date().toISOString().split('T')[0]
    const durationSeconds = duration || 0 // 使用传入的时长，如果没有则为0

    const { data: stats } = await supabase
      .from('daily_practice_stats')
      .select('*')
      .eq('user_id', user_id)
      .eq('practice_date', today)
      .single()

    if (stats) {
      const newCompletedCount = stats.completed_count + 1
      const currentTotal = (stats.avg_total_score || 0) * stats.completed_count
      const newAvgScore = (currentTotal + scores.total_score) / newCompletedCount
      const newTotalDuration = (stats.total_duration_seconds || 0) + durationSeconds

      await supabase
        .from('daily_practice_stats')
        .update({
          completed_count: newCompletedCount,
          avg_total_score: parseFloat(newAvgScore.toFixed(2)),
          total_duration_seconds: newTotalDuration,
        })
        .eq('user_id', user_id)
        .eq('practice_date', today)
    } else {
      await supabase.from('daily_practice_stats').insert({
        user_id,
        practice_date: today,
        target_count: 10,
        completed_count: 1,
        avg_total_score: scores.total_score,
        total_duration_seconds: durationSeconds,
      })
    }

    return NextResponse.json({
      success: true,
      attempt_id: attempt?.id,
      scores,
    })
  } catch (error: any) {
    console.error('Evaluation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
