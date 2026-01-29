"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Play, CheckCircle2, Clock, TrendingUp, Calendar, Youtube, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase'
import { emailToUUID } from '@/lib/user-utils'

interface DailyVideo {
  id: string
  video_id: string
  title: string
  description: string
  thumbnail_url: string
  duration: number
  channel_title: string
  category: string
  assigned_date: string
}

interface UserStats {
  total_videos_watched: number
  total_watch_time: number
  current_streak: number
  longest_streak: number
}

export function DailyVideoPage() {
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<DailyVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [checkedIn, setCheckedIn] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [notes, setNotes] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    // 获取当前登录用户
    const initUser = async () => {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        return null
      }
      const roleData = JSON.parse(selectedRole); const user = { id: emailToUUID(roleData.email), email: roleData.email }
      if (user) {
        setUserId(user.id)
      }
    }
    initUser()
  }, [])

  useEffect(() => {
    if (userId) {
      loadDailyVideo()
      loadCheckinStatus()
    }
  }, [userId])

  useEffect(() => {
    // 切换视频时重置笔记
    setNotes('')
    setCheckedIn(false)
  }, [currentIndex])

  const loadDailyVideo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video/daily')
      const data = await response.json()

      if (data.success) {
        setVideos(data.videos)
        if (!data.isNew) {
          toast.success(`今日已准备好 ${data.videos.length} 个视频`)
        }
      } else {
        toast.error('加载视频失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error loading video:', error)
      toast.error('加载视频失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCheckinStatus = async () => {
    try {
      const response = await fetch(`/api/video/checkin?user_id=${userId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        if (data.checkins.length > 0) {
          const todayCheckin = data.checkins[0]
          setCheckedIn(todayCheckin.completed)
          setWatchProgress(todayCheckin.watched_duration)
          setNotes(todayCheckin.notes || '')
        }
      }
    } catch (error) {
      console.error('Error loading checkin status:', error)
    }
  }

  const handleCheckin = async () => {
    const currentVideo = videos[currentIndex]
    if (!currentVideo) return

    try {
      const response = await fetch('/api/video/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          video_id: currentVideo.id,
          watched_duration: currentVideo.duration, // 假设看完了
          completed: true,
          notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCheckedIn(true)
        toast.success('打卡成功！连续学习 +1 天')
        loadCheckinStatus() // 刷新统计

        // 自动跳到下一个视频
        if (currentIndex < videos.length - 1) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1)
          }, 500)
        }
      } else {
        toast.error('打卡失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('打卡失败')
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '日常会话':
        return 'bg-blue-500/10 text-blue-700 border-blue-300'
      case '商务英语':
        return 'bg-purple-500/10 text-purple-700 border-purple-300'
      case '发音技巧':
        return 'bg-green-500/10 text-green-700 border-green-300'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">今日视频加载失败</h2>
        <p className="text-muted-foreground mb-4">
          请稍后重试或联系管理员
        </p>
        <Button onClick={loadDailyVideo}>重新加载</Button>
      </Card>
    )
  }

  const currentVideo = videos[currentIndex]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          每日视频学习
        </h2>
        <p className="text-gray-600 mt-2 text-base">
          今日为你精选了 {videos.length} 个英语学习视频，持续观看提升你的英语能力
        </p>
      </div>

      {/* 进度指示器 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          第 <span className="font-bold text-gray-900">{currentIndex + 1}</span> / {videos.length} 个视频
        </div>
        <div className="flex gap-2">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-indigo-500'
                  : index < currentIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-orange-500 shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">当前连续</span>
            </div>
            <p className="text-4xl font-bold text-orange-600">{stats.current_streak}</p>
            <p className="text-sm text-gray-500 mt-1">天</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-yellow-500 shadow-sm">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">最长记录</span>
            </div>
            <p className="text-4xl font-bold text-yellow-600">{stats.longest_streak}</p>
            <p className="text-sm text-gray-500 mt-1">天</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-emerald-500 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">已观看</span>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{stats.total_videos_watched}</p>
            <p className="text-sm text-gray-500 mt-1">个视频</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-indigo-500 shadow-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">总时长</span>
            </div>
            <p className="text-4xl font-bold text-indigo-600">
              {Math.floor(stats.total_watch_time / 60)}
            </p>
            <p className="text-sm text-gray-500 mt-1">分钟</p>
          </div>
        </div>
      )}

      {/* 今日视频卡片 */}
      <div className="rounded-3xl bg-white p-8 soft-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-500">
              <Play className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">正在观看</h3>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(currentVideo.category)}`}>
            {currentVideo.category}
          </div>
        </div>

        {/* 视频播放器 */}
        <div className="aspect-video bg-black rounded-3xl mb-6 overflow-hidden soft-shadow">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideo.video_id}?rel=0`}
            title={currentVideo.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* 视频信息 */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{currentVideo.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">{currentVideo.channel_title}</span>
              <span>•</span>
              <span>{formatDuration(currentVideo.duration)}</span>
            </div>
          </div>

          {currentVideo.description && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-2xl p-5">
              <p className="line-clamp-3 leading-relaxed">{currentVideo.description}</p>
            </div>
          )}

          {/* 学习笔记 */}
          <div>
            <label className="text-sm font-semibold mb-3 block text-gray-900">
              学习笔记（选填）
            </label>
            <Textarea
              placeholder="记录你的学习心得、生词、重点..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={checkedIn}
              className="rounded-2xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* 打卡按钮和翻页 */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            {/* 左侧：翻页按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一个
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentIndex === videos.length - 1}
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                下一个
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* 右侧：打卡按钮 */}
            {checkedIn ? (
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2 rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="font-semibold">已完成打卡</span>
              </div>
            ) : (
              <Button
                onClick={handleCheckin}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                完成打卡
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border border-indigo-100">
        <p className="text-sm text-indigo-900 leading-relaxed">
          💡 <span className="font-semibold">学习建议：</span>
          观看完当前视频后点击"完成打卡"，系统会自动跳转到下一个视频。
          今天共有 {videos.length} 个精选视频，建议全部观看以获得最佳学习效果！
        </p>
      </div>
    </div>
  )
}
