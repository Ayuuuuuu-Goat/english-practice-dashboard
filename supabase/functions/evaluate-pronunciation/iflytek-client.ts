// 科大讯飞语音评测 WebSocket 客户端

import { generateAuthUrl } from './signature.ts'

interface IFlyTekConfig {
  appId: string
  apiKey: string
  apiSecret: string
}

interface EvaluateParams {
  audioData: ArrayBuffer
  text: string
  language: 'en' | 'zh'
  category: 'read_syllable' | 'read_word' | 'read_sentence' | 'read_chapter'
}

/**
 * 去除WAV文件头，提取PCM原始数据
 */
function stripWavHeader(audioBuffer: ArrayBuffer): ArrayBuffer {
  const view = new Uint8Array(audioBuffer)

  // WAV文件格式检查
  if (view.length < 44) {
    console.warn('Audio buffer too small, might not be a valid WAV file')
    return audioBuffer
  }

  // 检查是否是WAV文件 (RIFF标识)
  const header = String.fromCharCode(...view.slice(0, 4))
  if (header !== 'RIFF') {
    console.log('Not a WAV file (no RIFF header), using as-is')
    return audioBuffer
  }

  // 检查WAV格式标识
  const format = String.fromCharCode(...view.slice(8, 12))
  if (format !== 'WAVE') {
    console.warn('Not a standard WAV file')
    return audioBuffer
  }

  // 查找 "data" chunk
  let offset = 12
  while (offset < view.length - 8) {
    const chunkId = String.fromCharCode(...view.slice(offset, offset + 4))
    const chunkSize = view[offset + 4] | (view[offset + 5] << 8) | (view[offset + 6] << 16) | (view[offset + 7] << 24)

    if (chunkId === 'data') {
      // 找到data chunk，返回PCM数据部分
      const pcmData = view.slice(offset + 8, offset + 8 + chunkSize)
      console.log(`Stripped WAV header: ${offset + 8} bytes removed, PCM data: ${pcmData.length} bytes`)
      return pcmData.buffer
    }

    offset += 8 + chunkSize
  }

  // 如果没找到data chunk，返回去除前44字节的数据（标准WAV头大小）
  console.log('No data chunk found, removing standard 44-byte header')
  return view.slice(44).buffer
}

/**
 * 格式化评测文本
 */
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

/**
 * 科大讯飞语音评测客户端
 */
export class IFlyTekClient {
  private config: IFlyTekConfig

  constructor(config: IFlyTekConfig) {
    this.config = config
  }

  /**
   * 评测发音
   */
  async evaluate(params: EvaluateParams): Promise<any> {
    const { audioData, text, language, category } = params

    // 去除WAV头部，提取PCM数据
    const pcmData = stripWavHeader(audioData)
    console.log('Original audio size:', audioData.byteLength, 'PCM data size:', pcmData.byteLength)

    // 格式化评测文本
    const formattedText = formatEvaluationText(text, category, language)
    console.log('Formatted text for evaluation:', formattedText)

    // 构建参数帧（第一帧）
    const paramsFrame = {
      common: {
        app_id: this.config.appId,
      },
      business: {
        category: category,
        sub: 'ise',
        ent: language === 'en' ? 'en_vip' : 'cn_vip',
        cmd: 'ssb',
        aue: 'raw', // 音频格式
        auf: 'audio/L16;rate=16000', // 音频采样率
        ttp_skip: true,
        group: 'adult',
        text: '\uFEFF' + formattedText, // UTF-8 BOM + 格式化的待评测文本
      },
      data: {
        status: 0, // 第一帧：参数
      },
    }

    // 构建音频帧（第二帧）
    const audioFrame = {
      business: {
        cmd: 'auw',
        aus: 1, // 音频编码：raw
      },
      data: {
        status: 2, // 最后一帧：音频数据
      },
    }

    try {
      // 生成认证URL
      const baseUrl = 'wss://ise-api.xfyun.cn/v2/open-ise'
      const requestLine = 'GET /v2/open-ise HTTP/1.1'

      const authUrl = await generateAuthUrl({
        appId: this.config.appId,
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        baseUrl,
        requestLine,
      })

      // 建立 WebSocket 连接
      const result = await this.sendWebSocketRequest(authUrl, paramsFrame, audioFrame, pcmData)

      return result
    } catch (error) {
      console.error('iFlyTek evaluation error:', error)
      throw error
    }
  }

  /**
   * 发送 WebSocket 请求
   */
  private async sendWebSocketRequest(
    url: string,
    paramsFrame: any,
    audioFrame: any,
    audioData: ArrayBuffer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      let result = ''

      ws.onopen = () => {
        console.log('WebSocket connected')

        // 先发送参数帧
        console.log('Sending params frame...')
        ws.send(JSON.stringify(paramsFrame))

        // 分块发送音频（使用较大块以提高速度）
        // 最大：12000字节原始音频 ≈ 16000字节base64 < 26000限制
        const CHUNK_SIZE = 12000
        const FRAME_INTERVAL = 20 // 帧间隔（毫秒）- 降低延迟
        const audioArray = new Uint8Array(audioData)
        const audioChunks: Uint8Array[] = []

        for (let i = 0; i < audioArray.length; i += CHUNK_SIZE) {
          audioChunks.push(audioArray.slice(i, i + CHUNK_SIZE))
        }

        console.log(`Audio size: ${audioArray.length} bytes, will send in ${audioChunks.length} chunks`)

        // 延迟发送音频帧
        let chunkIndex = 0
        const sendNextChunk = () => {
          if (chunkIndex >= audioChunks.length) {
            return
          }

          const chunk = audioChunks[chunkIndex]
          const isFirstChunk = chunkIndex === 0
          const isLastChunk = chunkIndex === audioChunks.length - 1
          const audioBase64 = btoa(String.fromCharCode(...chunk))

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

          const chunkFrame = {
            business: {
              cmd: 'auw',
              aus: aus,
            },
            data: {
              status: isLastChunk ? 2 : 1, // 1=继续，2=最后一帧
              data: audioBase64,
            },
          }

          console.log(`Sending audio chunk ${chunkIndex + 1}/${audioChunks.length} (${chunk.length} bytes)`)
          ws.send(JSON.stringify(chunkFrame))

          chunkIndex++

          if (!isLastChunk) {
            setTimeout(sendNextChunk, FRAME_INTERVAL)
          }
        }

        setTimeout(sendNextChunk, 20)
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)

          // 检查错误
          if (response.code !== 0) {
            reject(new Error(`iFlyTek API Error: ${response.message}`))
            ws.close()
            return
          }

          // 累积结果
          if (response.data) {
            if (response.data.data) {
              console.log('Received result chunk, length:', response.data.data.length)
              result += response.data.data
            }
          }

          // 检查是否完成
          if (response.data && response.data.status === 2) {
            console.log('Received final frame, closing connection')
            ws.close()
          }
        } catch (error) {
          reject(error)
          ws.close()
        }
      }

      ws.onclose = () => {
        console.log('WebSocket closed')

        if (result) {
          try {
            console.log('Total result length:', result.length)
            console.log('Result first 100 chars:', result.substring(0, 100))

            // 解码结果
            const decodedResult = atob(result)
            console.log('Decoded result length:', decodedResult.length)
            console.log('Decoded result first 200 chars:', decodedResult.substring(0, 200))

            const parsedResult = JSON.parse(decodedResult)
            console.log('Parsed result successfully')
            resolve(parsedResult)
          } catch (error) {
            console.error('Error details:', error)
            console.error('Result that failed to parse:', result.substring(0, 500))
            reject(new Error('Failed to parse result: ' + error))
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      // 设置超时
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close()
          reject(new Error('Request timeout'))
        }
      }, 30000) // 30秒超时
    })
  }
}
