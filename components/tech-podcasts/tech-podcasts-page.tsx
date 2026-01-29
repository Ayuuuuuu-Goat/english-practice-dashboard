"use client"

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Headphones, Loader2, Clock, Play, Pause, SkipBack, SkipForward, Volume2, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'

interface Podcast {
  id: string
  title: string
  speaker: string
  source: string
  category: string
  audio_url: string
  transcript: string
  duration_seconds: number
  difficulty: string
  description: string
}


export function TechPodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('listen')
  const [durationFilter, setDurationFilter] = useState<string>('all')

  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 根据时长筛选播客
  const getFilteredPodcasts = () => {
    if (durationFilter === 'all') return podcasts

    return podcasts.filter(podcast => {
      const minutes = Math.floor(podcast.duration_seconds / 60)

      switch (durationFilter) {
        case '0-15':
          return minutes < 15
        case '15-30':
          return minutes >= 15 && minutes < 30
        case '30-45':
          return minutes >= 30 && minutes < 45
        case '45-60':
          return minutes >= 45 && minutes < 60
        case '60+':
          return minutes >= 60
        default:
          return true
      }
    })
  }

  const filteredPodcasts = getFilteredPodcasts()

  // 获取每个时长范围的播客数量
  const getDurationCounts = () => {
    const counts = {
      'all': podcasts.length,
      '0-15': 0,
      '15-30': 0,
      '30-45': 0,
      '45-60': 0,
      '60+': 0
    }

    podcasts.forEach(podcast => {
      const minutes = Math.floor(podcast.duration_seconds / 60)
      if (minutes < 15) counts['0-15']++
      else if (minutes < 30) counts['15-30']++
      else if (minutes < 45) counts['30-45']++
      else if (minutes < 60) counts['45-60']++
      else counts['60+']++
    })

    return counts
  }

  const durationCounts = getDurationCounts()

  useEffect(() => {
    loadPodcasts()
  }, [])

  // 当筛选条件改变时，检查当前选中的播客是否还在列表中
  useEffect(() => {
    if (selectedPodcast && podcasts.length > 0) {
      const filtered = getFilteredPodcasts()
      const isStillInList = filtered.some(p => p.id === selectedPodcast.id)
      if (!isStillInList && filtered.length > 0) {
        // 如果当前播客不在筛选结果中，选择第一个
        setSelectedPodcast(filtered[0])
      }
    }
  }, [durationFilter, podcasts, selectedPodcast])


  // 音频播放控制
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', updateDuration)

    // 手动触发一次，以防已经加载完成
    if (audio.readyState >= 1) {
      updateDuration()
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', updateDuration)
    }
  }, [selectedPodcast]) // 当选择新播客时重新绑定

  const loadPodcasts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tech_podcasts')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) throw error

      // 如果没有播客数据，自动初始化
      if (!data || data.length === 0) {
        console.log('没有播客数据，正在初始化...')
        await initializePodcasts()
        return
      }

      setPodcasts(data || [])
      if (data && data.length > 0) {
        setSelectedPodcast(data[0])
      }
    } catch (error) {
      console.error('加载播客失败:', error)
      toast.error('加载播客失败')
    } finally {
      setLoading(false)
    }
  }

  const initializePodcasts = async () => {
    try {
      setLoading(true)
      toast.info('正在加载真实音频资源...')

      const response = await fetch('/api/podcasts/seed-real-podcasts', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`成功加载 ${result.successCount} 个播客`)
        // 重新加载播客列表
        const supabase = createClient()
        const { data, error } = await supabase
          .from('tech_podcasts')
          .select('*')
          .order('published_at', { ascending: false })

        if (error) throw error
        setPodcasts(data || [])
        if (data && data.length > 0) {
          setSelectedPodcast(data[0])
        }
      } else {
        toast.error('初始化播客失败')
      }
    } catch (error) {
      console.error('初始化播客失败:', error)
      toast.error('初始化播客失败')
    } finally {
      setLoading(false)
    }
  }


  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 10)
    }
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 10)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      const vol = value[0] / 100
      audio.volume = vol
      setVolume(value[0])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSelectPodcast = (podcast: Podcast) => {
    setSelectedPodcast(podcast)
    setActiveTab('listen')
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.load() // 重新加载音频
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      ai: 'bg-purple-100 text-purple-700',
      startup: 'bg-green-100 text-green-700',
      design: 'bg-blue-100 text-blue-700',
      leadership: 'bg-orange-100 text-orange-700'
    }
    const labels = {
      ai: 'AI/科技',
      startup: '创业故事',
      design: '产品设计',
      leadership: '领导力'
    }
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>
        {labels[category as keyof typeof labels] || category}
      </Badge>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    }
    const labels = {
      easy: '初级',
      medium: '中级',
      hard: '高级'
    }
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>
        {labels[difficulty as keyof typeof labels] || difficulty}
      </Badge>
    )
  }

  const getCurrentIndex = () => {
    if (!selectedPodcast) return -1
    return filteredPodcasts.findIndex(p => p.id === selectedPodcast.id)
  }

  const handlePrevious = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex > 0) {
      handleSelectPodcast(filteredPodcasts[currentIndex - 1])
    }
  }

  const handleNext = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex < filteredPodcasts.length - 1) {
      handleSelectPodcast(filteredPodcasts[currentIndex + 1])
    }
  }

  const canGoPrevious = () => getCurrentIndex() > 0
  const canGoNext = () => getCurrentIndex() < filteredPodcasts.length - 1


  const NavigationButtons = () => {
    const currentIndex = getCurrentIndex()
    return (
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <Button
          onClick={handlePrevious}
          disabled={!canGoPrevious()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          上一个
        </Button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {filteredPodcasts.length}
        </span>
        <Button
          onClick={handleNext}
          disabled={!canGoNext()}
          className="flex items-center gap-2"
        >
          下一个
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                技术播客精选
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                精选 TED、技术演讲、播客片段，提升听力和理解能力
              </p>
            </div>
            <Button
              onClick={initializePodcasts}
              variant="outline"
              className="flex items-center gap-2 bg-white hover:bg-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-200 self-start sm:self-auto"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新播客
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:items-start">
          {/* 左侧：播客列表 */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0 h-[52px] flex items-center">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 text-sm">
                  <Headphones className="h-4 w-4 text-purple-600" />
                  播客列表
                  <span className="text-xs text-gray-500 font-normal">({filteredPodcasts.length})</span>
                </h3>
              </div>

              {/* 时长筛选器 - 精简版 */}
              {durationCounts['all'] > 0 && (
              <div className="p-3 sm:p-4 border-b flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">时长</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'all', label: '全部', count: durationCounts['all'] },
                    { key: '0-15', label: '<15′', count: durationCounts['0-15'] },
                    { key: '15-30', label: '15-30′', count: durationCounts['15-30'] },
                    { key: '30-45', label: '30-45′', count: durationCounts['30-45'] },
                    { key: '45-60', label: '45-60′', count: durationCounts['45-60'] },
                    { key: '60+', label: '60+′', count: durationCounts['60+'] },
                  ].map(({ key, label, count }) => (
                    count > 0 && (
                      <button
                        key={key}
                        onClick={() => setDurationFilter(key)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                          durationFilter === key
                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label} {count}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {filteredPodcasts.map((podcast) => (
                <button
                  key={podcast.id}
                  onClick={() => handleSelectPodcast(podcast)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all duration-200 group ${
                    selectedPodcast?.id === podcast.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-[1.02]'
                      : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getCategoryBadge(podcast.category)}
                    {getDifficultyBadge(podcast.difficulty)}
                  </div>
                  <p className={`font-medium text-sm sm:text-base line-clamp-2 mb-2 ${
                    selectedPodcast?.id === podcast.id ? 'text-white' : 'text-gray-900 group-hover:text-purple-600'
                  }`}>
                    {podcast.title}
                  </p>
                  <p className={`text-xs mb-1 ${
                    selectedPodcast?.id === podcast.id ? 'text-purple-100' : 'text-gray-500'
                  }`}>{podcast.speaker}</p>
                  <div className={`flex items-center gap-2 text-xs ${
                    selectedPodcast?.id === podcast.id ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {formatTime(podcast.duration_seconds)}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

          {/* 右侧：播客内容 */}
          <div className="lg:col-span-8 xl:col-span-9">
          {selectedPodcast && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden h-auto lg:h-[calc(100vh-200px)]">
              {/* 隐藏的音频元素 */}
              <audio
                ref={audioRef}
                src={selectedPodcast.audio_url}
                preload="metadata"
              />

              <div className="p-6 sm:p-8 overflow-y-auto h-full">
                <div className="space-y-6">
                  {/* 标题信息 */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      {getCategoryBadge(selectedPodcast.category)}
                      {getDifficultyBadge(selectedPodcast.difficulty)}
                      <Badge variant="outline">{selectedPodcast.source}</Badge>
                    </div>
                    <h1 className="text-3xl font-bold mb-3">{selectedPodcast.title}</h1>
                    <p className="text-lg text-gray-600 mb-2">
                      演讲者: {selectedPodcast.speaker}
                    </p>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {selectedPodcast.description}
                    </p>
                  </div>

                  {/* 音频播放器 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 space-y-4">
                    {/* 进度条 */}
                    <div className="space-y-2">
                      <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* 播放控制 */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipBackward}
                        className="h-12 w-12"
                      >
                        <SkipBack className="h-6 w-6" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={togglePlay}
                        className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isPlaying ? (
                          <Pause className="h-8 w-8" />
                        ) : (
                          <Play className="h-8 w-8 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipForward}
                        className="h-12 w-12"
                      >
                        <SkipForward className="h-6 w-6" />
                      </Button>
                    </div>

                    {/* 音量控制 */}
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-gray-600" />
                      <Slider
                        value={[volume]}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">{volume}%</span>
                    </div>
                  </div>
                </div>
                <NavigationButtons />
              </div>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
