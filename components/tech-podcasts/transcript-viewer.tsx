"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface TranscriptSegment {
  id: number
  start: number
  end: number
  text: string
}

interface TranscriptViewerProps {
  transcript: string
  segments?: TranscriptSegment[]
  currentTime: number
  onSeek: (time: number) => void
}

export function TranscriptViewer({
  transcript,
  segments,
  currentTime,
  onSeek
}: TranscriptViewerProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null)
  const activeSegmentRef = useRef<HTMLDivElement>(null)

  // 解析简单文本为句子（如果没有segments）
  const parsedSegments: TranscriptSegment[] = segments || parseTextToSegments(transcript)

  // 根据当前时间更新高亮的句子
  useEffect(() => {
    const currentSegment = parsedSegments.find(
      seg => currentTime >= seg.start && currentTime <= seg.end
    )

    if (currentSegment) {
      setActiveSegmentId(currentSegment.id)
    }
  }, [currentTime, parsedSegments])

  // 自动滚动到当前句子
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [activeSegmentId])

  const handleSegmentClick = (segment: TranscriptSegment) => {
    onSeek(segment.start)
  }

  const downloadTranscript = () => {
    const text = parsedSegments.map(seg => seg.text).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">文本对照</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTranscript}
        >
          <Download className="h-4 w-4 mr-2" />
          下载文本
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {parsedSegments.map((segment) => (
            <div
              key={segment.id}
              ref={activeSegmentId === segment.id ? activeSegmentRef : null}
              onClick={() => handleSegmentClick(segment)}
              className={`
                p-4 rounded-lg cursor-pointer transition-all duration-300
                ${activeSegmentId === segment.id
                  ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md'
                  : 'hover:bg-gray-50 border-2 border-transparent'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* 时间标记 */}
                <span className={`
                  text-xs font-mono px-2 py-1 rounded flex-shrink-0
                  ${activeSegmentId === segment.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {formatTime(segment.start)}
                </span>

                {/* 文本内容 */}
                <p className={`
                  text-base leading-relaxed flex-1
                  ${activeSegmentId === segment.id
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-700'
                  }
                `}>
                  {segment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 进度提示 */}
      <div className="text-sm text-gray-500 text-center">
        💡 点击任意句子跳转到对应时间点
      </div>
    </div>
  )
}

// 解析纯文本为句子段落（简单版本）
function parseTextToSegments(text: string): TranscriptSegment[] {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const avgDuration = 5 // 假设每句话5秒
  return sentences.map((sentence, index) => ({
    id: index,
    start: index * avgDuration,
    end: (index + 1) * avgDuration,
    text: sentence + (sentence.match(/[.!?]$/) ? '' : '.')
  }))
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
