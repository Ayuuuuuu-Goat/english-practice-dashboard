"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Volume2, Check, Calendar, Trophy, Briefcase, Mail, Handshake, Users, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { emailToUUID } from '@/lib/user-utils'

interface Phrase {
  id: string
  phrase_en: string
  phrase_cn: string
  category: string
  example_sentence: string
  example_translation: string
  usage_notes: string
  difficulty: string
}

export function BusinessPhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [learnedPhrases, setLearnedPhrases] = useState<Set<string>>(new Set())
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadPhrases()
    loadCheckinStatus()
  }, [category])

  const loadPhrases = async () => {
    try {
      const response = await fetch(`/api/phrases/daily?category=${category}&limit=8`)
      const data = await response.json()

      if (data.success) {
        setPhrases(data.phrases)
      }
    } catch (error) {
      console.error('Error loading phrases:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCheckinStatus = async () => {
    try {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) return

      const roleData = JSON.parse(selectedRole)
      const userId = emailToUUID(roleData.email)

      const response = await fetch(`/api/phrases/checkin?user_id=${userId}`)
      const data = await response.json()

      if (data.success) {
        setHasCheckedIn(data.hasCheckedInToday)
        setRecentCheckins(data.recentCheckins || [])
        if (data.todayCheckin) {
          setLearnedPhrases(new Set(data.todayCheckin.phrases_learned || []))
        }
      }
    } catch (error) {
      console.error('Error loading checkin status:', error)
    }
  }

  const handleLearnPhrase = (phraseId: string) => {
    setLearnedPhrases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phraseId)) {
        newSet.delete(phraseId)
      } else {
        newSet.add(phraseId)
      }
      return newSet
    })
  }

  const handleCheckin = async () => {
    try {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        toast.error('请先选择角色')
        return
      }

      const roleData = JSON.parse(selectedRole)
      const userId = emailToUUID(roleData.email)

      const response = await fetch('/api/phrases/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          phrase_ids: Array.from(learnedPhrases)
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`打卡成功！今日学习 ${learnedPhrases.size} 个短语`)
        setHasCheckedIn(true)
        await loadCheckinStatus()
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('打卡失败')
    }
  }

  const handleGeneratePhrases = async () => {
    setGenerating(true)
    toast.loading('正在AI生成新短语...', { id: 'generating' })

    try {
      const response = await fetch('/api/phrases/generate', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`成功生成 ${data.inserted} 个新短语！`, { id: 'generating' })
        await loadPhrases()
      } else {
        toast.error('生成失败: ' + data.error, { id: 'generating' })
      }
    } catch (error) {
      console.error('Error generating phrases:', error)
      toast.error('生成失败', { id: 'generating' })
    } finally {
      setGenerating(false)
    }
  }

  const speakPhrase = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    } else {
      toast.error('您的浏览器不支持语音朗读')
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'meeting': return <Briefcase className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'negotiation': return <Handshake className="h-4 w-4" />
      case 'social': return <Users className="h-4 w-4" />
      default: return null
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      meeting: '会议',
      email: '邮件',
      negotiation: '谈判',
      social: '社交'
    }
    return labels[cat] || cat
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                每日商务短语 - Daily Business Phrases
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                每天精选地道商务英语表达，提升职场沟通能力
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600">{learnedPhrases.size}</div>
                <div className="text-xs text-gray-500">今日已学</div>
              </div>
              <Button
                onClick={handleGeneratePhrases}
                disabled={generating}
                variant="outline"
                className="border-amber-200 hover:bg-amber-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI生成新短语
                  </>
                )}
              </Button>
              <Button
                onClick={handleCheckin}
                disabled={hasCheckedIn || learnedPhrases.size === 0}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {hasCheckedIn ? '已打卡' : '打卡'}
              </Button>
            </div>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: '全部', icon: <Trophy className="h-4 w-4" /> },
              { value: 'meeting', label: '会议', icon: <Briefcase className="h-4 w-4" /> },
              { value: 'email', label: '邮件', icon: <Mail className="h-4 w-4" /> },
              { value: 'negotiation', label: '谈判', icon: <Handshake className="h-4 w-4" /> },
              { value: 'social', label: '社交', icon: <Users className="h-4 w-4" /> },
            ].map(cat => (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.value)}
                className={category === cat.value ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {cat.icon}
                <span className="ml-2">{cat.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 短语列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {phrases.map((phrase) => (
            <Card
              key={phrase.id}
              className={`border-0 shadow-lg transition-all duration-200 ${
                learnedPhrases.has(phrase.id)
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-500'
                  : 'bg-white/80 backdrop-blur-sm hover:shadow-xl'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(phrase.category)}
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(phrase.category)}
                    </Badge>
                    {getDifficultyBadge(phrase.difficulty)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleLearnPhrase(phrase.id)}
                    className={learnedPhrases.has(phrase.id) ? 'text-amber-600' : ''}
                  >
                    <Check className={`h-5 w-5 ${learnedPhrases.has(phrase.id) ? 'opacity-100' : 'opacity-30'}`} />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{phrase.phrase_en}</h3>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => speakPhrase(phrase.phrase_en)}
                        className="h-8 w-8"
                      >
                        <Volume2 className="h-4 w-4 text-amber-600" />
                      </Button>
                    </div>
                    <p className="text-gray-600">{phrase.phrase_cn}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-sm italic text-gray-700">{phrase.example_sentence}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => speakPhrase(phrase.example_sentence)}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <Volume2 className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                    {phrase.example_translation && (
                      <p className="text-xs text-gray-500">{phrase.example_translation}</p>
                    )}
                  </div>

                  {phrase.usage_notes && (
                    <div className="text-xs text-gray-500 bg-amber-50 rounded p-2">
                      💡 {phrase.usage_notes}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 打卡记录 */}
        {recentCheckins.length > 0 && (
          <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                最近打卡记录
              </h3>
              <div className="flex gap-2">
                {recentCheckins.map((checkin, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 bg-amber-50 rounded-lg"
                  >
                    <div className="text-xs text-gray-500">
                      {new Date(checkin.checkin_date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </div>
                    <div className="text-lg font-bold text-amber-600">{checkin.total_phrases}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
