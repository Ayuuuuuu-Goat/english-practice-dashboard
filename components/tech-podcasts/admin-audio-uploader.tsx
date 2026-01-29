"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Upload, Link2 } from 'lucide-react'

interface AudioUploaderProps {
  podcastId: string
  currentAudioUrl?: string
  onUpdate?: () => void
}

export function AdminAudioUploader({ podcastId, currentAudioUrl, onUpdate }: AudioUploaderProps) {
  const [audioUrl, setAudioUrl] = useState(currentAudioUrl || '')
  const [loading, setLoading] = useState(false)

  const handleUpdateUrl = async () => {
    if (!audioUrl.trim()) {
      toast.error('请输入音频URL')
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('tech_podcasts')
        .update({ audio_url: audioUrl })
        .eq('id', podcastId)

      if (error) throw error

      toast.success('音频URL已更新')
      onUpdate?.()
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('请选择音频文件')
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // 上传到Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${podcastId}-${Date.now()}.${fileExt}`
      const filePath = `podcasts/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath)

      // 更新数据库
      const { error: updateError } = await supabase
        .from('tech_podcasts')
        .update({ audio_url: publicUrl })
        .eq('id', podcastId)

      if (updateError) throw updateError

      setAudioUrl(publicUrl)
      toast.success('音频文件已上传')
      onUpdate?.()
    } catch (error: any) {
      console.error('上传失败:', error)
      toast.error(`上传失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="audio-url">音频URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="audio-url"
              type="url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="flex-1"
            />
            <Button
              onClick={handleUpdateUrl}
              disabled={loading}
              size="sm"
            >
              <Link2 className="h-4 w-4 mr-1" />
              更新URL
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            支持的格式: MP3, WAV, OGG, M4A
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="audio-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">点击上传</span> 或拖拽文件
                </p>
                <p className="text-xs text-gray-500">
                  支持 MP3, WAV, OGG, M4A (最大 50MB)
                </p>
              </div>
              <input
                id="audio-upload"
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {currentAudioUrl && (
          <div className="mt-4">
            <Label>当前音频</Label>
            <audio
              controls
              className="w-full mt-2"
              src={currentAudioUrl}
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
      </div>
    </Card>
  )
}
