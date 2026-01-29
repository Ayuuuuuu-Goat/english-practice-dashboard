"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { AudioRecorder, convertToWAV, uploadAudioToBlob, formatDuration } from '@/lib/pronunciation/audio-utils'
import type { RecordingStatus } from '@/lib/pronunciation/types'

interface AudioRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number) => void
  onError: (error: string) => void
  disabled?: boolean
}

export function AudioRecorderComponent({ onRecordingComplete, onError, disabled }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setStatus('requesting-permission')
      setDuration(0)

      // 创建录音器实例
      const recorder = new AudioRecorder()
      recorderRef.current = recorder

      // 开始录音
      await recorder.start()
      setStatus('recording')

      // 启动计时器
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Recording error:', error)
      onError('无法开始录音，请检查麦克风权限')
      setStatus('idle')
    }
  }

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) return

      // 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setStatus('processing')

      // 停止录音
      const audioBlob = await recorderRef.current.stop()

      // 转换为WAV格式
      const wavBlob = await convertToWAV(audioBlob)

      setStatus('uploading')

      // 上传到Vercel Blob
      const timestamp = Date.now()
      const filename = `recording-${timestamp}.wav`
      const audioUrl = await uploadAudioToBlob(wavBlob, filename)

      setStatus('completed')

      // 通知父组件
      onRecordingComplete(audioUrl, duration)

      // 重置状态
      setTimeout(() => {
        setStatus('idle')
        setDuration(0)
      }, 1000)
    } catch (error) {
      console.error('Stop recording error:', error)
      onError('录音处理失败')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'requesting-permission':
        return '请求权限中...'
      case 'recording':
        return `录音中 ${formatDuration(duration)}`
      case 'processing':
        return '处理中...'
      case 'uploading':
        return '上传中...'
      case 'completed':
        return '完成！'
      case 'error':
        return '错误'
      default:
        return '点击录音'
    }
  }

  const isRecording = status === 'recording'
  const isProcessing = ['requesting-permission', 'processing', 'uploading'].includes(status)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* 录音按钮 */}
        <Button
          size="lg"
          variant={isRecording ? 'destructive' : 'default'}
          className={`relative h-24 w-24 rounded-full ${
            isRecording ? 'animate-pulse' : ''
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>

        {/* 录音动画波纹 */}
        {isRecording && (
          <>
            <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-red-500 opacity-75" />
            <div
              className="absolute inset-0 -z-10 animate-pulse rounded-full bg-red-500 opacity-50"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
      </div>

      {/* 状态文本 */}
      <div className="text-center">
        <p className="text-sm font-medium">{getButtonText()}</p>
        {isRecording && (
          <p className="text-xs text-muted-foreground mt-1">
            点击停止按钮结束录音
          </p>
        )}
      </div>

      {/* 音频可视化提示 */}
      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
