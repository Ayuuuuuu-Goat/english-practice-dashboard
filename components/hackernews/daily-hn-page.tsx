"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare, TrendingUp, CheckCircle2, BookOpen, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { formatHNTime } from '@/lib/hackernews/hn-api'
import { emailToUUID } from '@/lib/user-utils'

interface HNStory {
  id: string
  hn_id: number
  title: string
  url?: string
  text?: string
  score: number
  descendants: number
  author: string
  posted_at: string
  assigned_date: string

  // 抓取相关字段
  original_url?: string
  content_source?: string
  scraped_content?: string
  scraped_images?: Array<{url: string, alt: string}>
  scrape_status?: string
  scrape_error?: string
}

interface UserStats {
  total_stories_read: number
  current_streak: number
  longest_streak: number
}

interface ReadingRecord {
  story_id: string
  read_completed: boolean
  notes?: string
}

export function DailyHNPage() {
  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<HNStory[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [readingRecords, setReadingRecords] = useState<Map<string, ReadingRecord>>(new Map())
  const [notes, setNotes] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [iframeError, setIframeError] = useState<Map<string, boolean>>(new Map())
  const [screenshotLoading, setScreenshotLoading] = useState<Map<string, boolean>>(new Map())
  const [screenshotUrl, setScreenshotUrl] = useState<Map<string, string>>(new Map())
  const [iframeLoading, setIframeLoading] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    const initUser = () => {
      const selectedRole = localStorage.getItem('selectedRole')
      if (selectedRole) {
        const role = JSON.parse(selectedRole)
        setUserId(emailToUUID(role.email)) // 使用email作为用户标识
      }
    }
    initUser()
  }, [])

  useEffect(() => {
    if (userId) {
      loadDailyStories()
      loadReadingStatus()
    }
  }, [userId])

  useEffect(() => {
    // 切换文章时加载对应的笔记和重置 iframe 状态
    if (stories[currentIndex]) {
      const record = readingRecords.get(stories[currentIndex].id)
      setNotes(record?.notes || '')

      // 重置当前文章的 iframe 加载状态
      const storyId = stories[currentIndex].id
      setIframeLoading(prev => new Map(prev).set(storyId, true))

      // 设置超时：如果 10 秒后 iframe 还在加载，自动尝试截图
      const timeout = setTimeout(() => {
        if (iframeLoading.get(storyId) && !iframeError.get(storyId) && !screenshotUrl.get(storyId)) {
          console.log('Iframe 加载超时，尝试截图')
          const story = stories[currentIndex]
          if (story.url || story.original_url) {
            handleIframeError(storyId, story.url || story.original_url!)
          }
        }
      }, 10000) // 10秒超时

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, stories, readingRecords])

  const handleIframeError = (storyId: string, url: string) => {
    console.log(`Iframe 加载失败，尝试截图: ${url}`)
    setIframeError(prev => new Map(prev).set(storyId, true))
    // 自动触发截图
    handleTakeScreenshot(storyId, url)
  }

  const handleIframeLoad = (storyId: string) => {
    setIframeLoading(prev => new Map(prev).set(storyId, false))
  }

  const handleTakeScreenshot = async (storyId: string, url: string) => {
    console.log(`开始截图: ${url}`)

    setScreenshotLoading(prev => new Map(prev).set(storyId, true))

    try {
      const response = await fetch('/api/hn/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const screenshotObjectUrl = URL.createObjectURL(blob)
        setScreenshotUrl(prev => new Map(prev).set(storyId, screenshotObjectUrl))
        setIframeError(prev => new Map(prev).set(storyId, true))
        setScreenshotLoading(prev => new Map(prev).set(storyId, false))
        toast.success('已生成页面截图')
      } else {
        toast.error('截图失败，请点击"在新窗口打开"查看原文')
        setIframeError(prev => new Map(prev).set(storyId, true))
      }
    } catch (error) {
      console.error('截图失败:', error)
      toast.error('截图失败')
      setIframeError(prev => new Map(prev).set(storyId, true))
    } finally {
      setScreenshotLoading(prev => new Map(prev).set(storyId, false))
    }
  }

  useEffect(() => {
    // 自动检测 iframe 加载失败（10秒超时）
    if (stories[currentIndex] && (stories[currentIndex].url || stories[currentIndex].original_url)) {
      const storyId = stories[currentIndex].id
      const url = stories[currentIndex].url || stories[currentIndex].original_url!

      // 如果已经有截图或者已经标记失败，就不检测了
      if (screenshotUrl.get(storyId) || iframeError.get(storyId)) {
        return
      }

      const timer = setTimeout(() => {
        console.log(`iframe 可能加载失败，提示用户截图: ${url}`)
        // 不自动截图，而是显示提示
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, stories, screenshotUrl, iframeError])

  const loadDailyStories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hn/daily')
      const data = await response.json()

      if (data.success) {
        setStories(data.stories)
        if (!data.fromCache) {
          toast.success('成功获取今日 AI 文章')
        }
      } else {
        toast.error('加载文章失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error loading stories:', error)
      toast.error('加载文章失败')
    } finally {
      setLoading(false)
    }
  }

  const loadReadingStatus = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/hn/reading?user_id=${userId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)

        const recordsMap = new Map<string, ReadingRecord>()
        data.readings.forEach((reading: any) => {
          recordsMap.set(reading.story_id, {
            story_id: reading.story_id,
            read_completed: reading.read_completed,
            notes: reading.notes,
          })
        })

        setReadingRecords(recordsMap)
      }
    } catch (error) {
      console.error('Error loading reading status:', error)
    }
  }

  const handleMarkAsRead = async () => {
    const story = stories[currentIndex]
    if (!story || !userId) return

    try {
      const response = await fetch('/api/hn/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          story_id: story.id,
          read_completed: true,
          notes: notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('标记为已读')
        loadReadingStatus() // 重新加载统计数据

        // 自动跳到下一篇
        if (currentIndex < stories.length - 1) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1)
          }, 500)
        }
      } else {
        toast.error('操作失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('操作失败')
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white p-16 soft-shadow text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无文章</h3>
          <p className="text-gray-500">今天还没有找到合适的 AI 相关文章，请稍后再试</p>
        </div>
      </div>
    )
  }

  const currentStory = stories[currentIndex]
  const isRead = readingRecords.get(currentStory.id)?.read_completed || false

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          HN AI 资讯阅读
        </h2>
        <p className="text-gray-600 mt-2 text-base">
          每天精选 Hacker News 上最热门的 AI 相关讨论，提升英语阅读和技术视野
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-blue-500 shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">当前连续</span>
            </div>
            <p className="text-4xl font-bold text-blue-600">{stats.current_streak}</p>
            <p className="text-sm text-gray-500 mt-1">天</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-amber-500 shadow-sm">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">最长记录</span>
            </div>
            <p className="text-4xl font-bold text-amber-600">{stats.longest_streak}</p>
            <p className="text-sm text-gray-500 mt-1">天</p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 soft-shadow hover-scale">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-2xl bg-emerald-500 shadow-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">已阅读</span>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{stats.total_stories_read}</p>
            <p className="text-sm text-gray-500 mt-1">篇文章</p>
          </div>
        </div>
      )}

      {/* 进度指示器 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          第 <span className="font-bold text-gray-900">{currentIndex + 1}</span> / {stories.length} 篇
        </div>
        <div className="flex gap-2">
          {stories.map((_, index) => (
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

      {/* 文章卡片 */}
      <div className="rounded-3xl bg-white p-8 soft-shadow">
        {/* 文章头部 */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {currentStory.title}
          </h3>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg bg-indigo-100">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="font-semibold text-indigo-600">{currentStory.score}</span>
              <span>points</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-semibold text-purple-600">{currentStory.descendants}</span>
              <span>comments</span>
            </div>
            <span>by <span className="font-medium text-gray-900">{currentStory.author}</span></span>
            <span>{formatHNTime(new Date(currentStory.posted_at).getTime() / 1000)}</span>
          </div>
        </div>

        {/* 文章内容 - 优先级: 外链iframe/截图 > text */}
        {currentStory.url || currentStory.original_url ? (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
              {/* 原文链接标识 */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>原文来源:</span>
                  <a
                    href={currentStory.url || currentStory.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 underline font-medium"
                  >
                    {new URL(currentStory.url || currentStory.original_url!).hostname}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  {!screenshotUrl.get(currentStory.id) && (
                    <Button
                      onClick={() => handleTakeScreenshot(currentStory.id, currentStory.url || currentStory.original_url!)}
                      disabled={screenshotLoading.get(currentStory.id)}
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                    >
                      {screenshotLoading.get(currentStory.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          截图中...
                        </>
                      ) : (
                        '📸 生成截图'
                      )}
                    </Button>
                  )}
                  <a
                    href={currentStory.url || currentStory.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    在新窗口打开 →
                  </a>
                </div>
              </div>

              {/* 显示截图、加载状态或 iframe */}
              {screenshotUrl.get(currentStory.id) ? (
                // 显示截图
                <div className="w-full overflow-auto" style={{ maxHeight: '800px' }}>
                  <img
                    src={screenshotUrl.get(currentStory.id)}
                    alt="页面截图"
                    className="w-full"
                  />
                </div>
              ) : screenshotLoading.get(currentStory.id) ? (
                // 截图加载中
                <div className="w-full flex items-center justify-center" style={{ height: '400px' }}>
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-3" />
                    <p className="text-gray-600">页面无法嵌入，正在生成截图...</p>
                  </div>
                </div>
              ) : iframeError.get(currentStory.id) ? (
                // iframe 加载失败且截图也失败
                <div className="w-full p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔒</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        页面无法嵌入显示
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">
                        该网站限制了页面嵌入功能，自动截图也未能成功
                      </p>
                    </div>
                    <div className="space-y-3">
                      <a
                        href={currentStory.url || currentStory.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-6 py-3 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-colors font-semibold"
                      >
                        在新窗口打开阅读 →
                      </a>
                      <button
                        onClick={() => handleTakeScreenshot(currentStory.id, currentStory.url || currentStory.original_url!)}
                        className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors font-medium"
                      >
                        📸 重试截图
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // 尝试嵌入 iframe
                <div className="relative">
                  {iframeLoading.get(currentStory.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-3" />
                        <p className="text-gray-600">加载中...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={currentStory.id} // 强制重新加载
                    src={currentStory.url || currentStory.original_url}
                    className="w-full border-0"
                    style={{ height: '800px' }}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    title="文章内容"
                    onLoad={() => handleIframeLoad(currentStory.id)}
                    onError={() => handleIframeError(currentStory.id, currentStory.url || currentStory.original_url!)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : currentStory.text ? (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
              <div
                className="hn-content text-[17px] text-gray-800"
                dangerouslySetInnerHTML={{ __html: currentStory.text }}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              />
            </div>
          </div>
        ) : null}

        {/* 阅读笔记 */}
        <div className="mb-6">
          <label className="text-sm font-semibold mb-3 block text-gray-900">
            阅读笔记（记录生词、关键观点、个人思考）
          </label>
          <Textarea
            placeholder="记录你的学习心得、新词汇、重点内容..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            disabled={isRead}
            className="rounded-2xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* 底部操作栏 */}
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
              上一篇
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentIndex === stories.length - 1}
              variant="outline"
              className="rounded-2xl border-gray-200 hover:border-gray-300 disabled:opacity-50"
            >
              下一篇
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* 右侧：标记按钮 */}
          {isRead ? (
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-semibold">已完成阅读</span>
            </div>
          ) : (
            <Button
              onClick={handleMarkAsRead}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              标记为已读
            </Button>
          )}
        </div>

        {/* HN 讨论链接 */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <a
            href={`https://news.ycombinator.com/item?id=${currentStory.hn_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            在 Hacker News 上查看完整讨论
          </a>
        </div>
      </div>

      {/* 提示 */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border border-indigo-100">
        <p className="text-sm text-indigo-900 leading-relaxed">
          💡 <span className="font-semibold">学习建议：</span>
          仔细阅读文章内容，记录不认识的单词和重要观点。完成阅读后点击"标记为已读"，系统会自动跳转到下一篇。
          坚持每日阅读，不仅能提升英语水平，还能保持对 AI 前沿的敏锐洞察！
        </p>
      </div>
    </div>
  )
}
