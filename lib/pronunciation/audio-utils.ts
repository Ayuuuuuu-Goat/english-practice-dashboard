// 音频录制和处理工具

/**
 * 请求麦克风权限
 */
export async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // 科大讯飞要求16kHz
      },
    })
    return stream
  } catch (error) {
    console.error('Error requesting microphone permission:', error)
    throw new Error('无法访问麦克风，请检查权限设置')
  }
}

/**
 * 音频录制类
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    this.audioChunks = []

    try {
      // 获取媒体流
      this.stream = await requestMicrophonePermission()

      // 创建MediaRecorder实例
      // 使用webm格式，后续会转换为WAV
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps
      })

      console.log('MediaRecorder created:', {
        mimeType: this.mediaRecorder.mimeType,
        state: this.mediaRecorder.state,
      })

      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes')
          this.audioChunks.push(event.data)
        }
      }

      // 开始录音
      this.startTime = Date.now()
      this.mediaRecorder.start(100) // 每100ms产生一个数据块
      console.log('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      throw error
    }
  }

  /**
   * 停止录音
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'))
        return
      }

      this.mediaRecorder.onstop = async () => {
        try {
          console.log('Recording stopped, chunks collected:', this.audioChunks.length)
          console.log('Chunk sizes:', this.audioChunks.map(c => c.size))

          // 合并音频块
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          })

          console.log('Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
          })

          // 停止媒体流
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop())
          }

          resolve(audioBlob)
        } catch (error) {
          reject(error)
        }
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * 获取录音时长（秒）
   */
  getDuration(): number {
    if (this.startTime === 0) return 0
    return (Date.now() - this.startTime) / 1000
  }

  /**
   * 取消录音
   */
  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
    }
    this.audioChunks = []
  }
}

/**
 * 将音频Blob转换为WAV格式（16kHz, 16-bit, Mono）
 */
export async function convertToWAV(audioBlob: Blob): Promise<Blob> {
  try {
    console.log('Converting audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
    })

    // 创建AudioContext
    const audioContext = new AudioContext({ sampleRate: 16000 })
    console.log('AudioContext created, actual sample rate:', audioContext.sampleRate)

    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength)

    // 解码音频数据
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    console.log('Audio decoded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    })

    // 获取单声道数据（如果是立体声，混合为单声道）
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length
    const sampleRate = audioBuffer.sampleRate

    let monoData: Float32Array

    if (numberOfChannels === 1) {
      monoData = audioBuffer.getChannelData(0)
    } else {
      // 混合为单声道
      monoData = new Float32Array(length)
      const leftChannel = audioBuffer.getChannelData(0)
      const rightChannel = audioBuffer.getChannelData(1)

      for (let i = 0; i < length; i++) {
        monoData[i] = (leftChannel[i] + rightChannel[i]) / 2
      }
    }

    // 如果采样率不是16kHz，需要重采样
    let finalData = monoData
    let finalSampleRate = sampleRate

    if (sampleRate !== 16000) {
      const ratio = 16000 / sampleRate
      const newLength = Math.floor(length * ratio)
      finalData = new Float32Array(newLength)

      for (let i = 0; i < newLength; i++) {
        const position = i / ratio
        const index = Math.floor(position)
        const fraction = position - index

        if (index + 1 < length) {
          // 线性插值
          finalData[i] = monoData[index] * (1 - fraction) + monoData[index + 1] * fraction
        } else {
          finalData[i] = monoData[index]
        }
      }

      finalSampleRate = 16000
    }

    // 转换为16-bit PCM
    const pcmData = new Int16Array(finalData.length)
    for (let i = 0; i < finalData.length; i++) {
      const s = Math.max(-1, Math.min(1, finalData[i]))
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }

    // 检查音频数据（优化：使用循环避免栈溢出）
    let maxValue = 0
    for (let i = 0; i < pcmData.length; i++) {
      const absValue = Math.abs(pcmData[i])
      if (absValue > maxValue) {
        maxValue = absValue
      }
    }

    const first10 = []
    for (let i = 0; i < Math.min(10, pcmData.length); i++) {
      first10.push(pcmData[i])
    }

    console.log('PCM data stats:', {
      length: pcmData.length,
      maxAbsValue: maxValue,
      first10: first10,
    })

    if (maxValue === 0) {
      console.warn('Warning: PCM data is all zeros (silent)')
    }

    // 创建WAV文件
    const wavBlob = createWAVBlob(pcmData, finalSampleRate)

    // 关闭AudioContext
    await audioContext.close()

    return wavBlob
  } catch (error) {
    console.error('Error converting to WAV:', error)
    throw new Error('音频转换失败')
  }
}

/**
 * 创建WAV格式的Blob
 */
function createWAVBlob(pcmData: Int16Array, sampleRate: number): Blob {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmData.length * 2

  // WAV文件头部
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  // RIFF标识符
  writeString(view, 0, 'RIFF')
  // 文件大小
  view.setUint32(4, 36 + dataSize, true)
  // WAVE标识符
  writeString(view, 8, 'WAVE')
  // fmt chunk
  writeString(view, 12, 'fmt ')
  // fmt chunk大小
  view.setUint32(16, 16, true)
  // 音频格式 (1 = PCM)
  view.setUint16(20, 1, true)
  // 声道数
  view.setUint16(22, numChannels, true)
  // 采样率
  view.setUint32(24, sampleRate, true)
  // 字节率
  view.setUint32(28, byteRate, true)
  // 块对齐
  view.setUint16(32, blockAlign, true)
  // 位深度
  view.setUint16(34, bitsPerSample, true)
  // data chunk
  writeString(view, 36, 'data')
  // data chunk大小
  view.setUint32(40, dataSize, true)

  // 写入PCM数据
  const dataView = new Int16Array(buffer, 44)
  dataView.set(pcmData)

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * 在DataView中写入字符串
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * 上传音频到Vercel Blob
 */
export async function uploadAudioToBlob(audioBlob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', audioBlob, filename)

    const response = await fetch('/api/pronunciation/upload-audio', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error uploading audio:', error)
    throw new Error('音频上传失败')
  }
}

/**
 * 获取音频时长
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.onloadedmetadata = () => {
      resolve(audio.duration)
    }
    audio.onerror = () => {
      reject(new Error('Failed to load audio'))
    }
    audio.src = URL.createObjectURL(audioBlob)
  })
}

/**
 * 检查浏览器是否支持录音
 */
export function isRecordingSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  // Check if MediaRecorder constructor exists and is callable
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    hasMediaRecorder
  )
}

/**
 * 格式化录音时长
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
