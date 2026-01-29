"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, ArrowRight, RotateCcw, SkipForward, Trophy, Calendar } from 'lucide-react'
import { AudioRecorderComponent } from './audio-recorder'
import { WordCardDisplay } from './word-card-display'
import { ScoreDisplay } from './score-display'
import { MonsterBattle } from './monster-battle'
import { selectDailyWords } from '@/lib/pronunciation/word-selection'
import type { WordCard, PronunciationAttempt } from '@/lib/pronunciation/types'
import { toast } from 'sonner'
import { wordBank1 } from '@/lib/pronunciation/word-bank-1'
import { createClient } from '@/lib/supabase'
import { emailToUUID } from '@/lib/user-utils'

type PracticeState = 'loading' | 'ready' | 'recording' | 'evaluating' | 'result' | 'completed'

export function PronunciationPracticePage() {
  const [state, setState] = useState<PracticeState>('loading')
  const [words, setWords] = useState<WordCard[]>([])
  const [allWords, setAllWords] = useState<WordCard[]>([]) // 完整词库
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<any>(null)
  const [targetCount, setTargetCount] = useState(10)
  const [completedCount, setCompletedCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [showPhonetic, setShowPhonetic] = useState(true)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [monsterDamage, setMonsterDamage] = useState(0) // 怪兽受到的伤害

  useEffect(() => {
    initializePractice()
  }, [])

  const initializePractice = async () => {
    try {
      setState('loading')

      // 获取当前登录用户（从localStorage）
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        toast.error('请先登录')
        setState('ready')
        return
      }

      const role = JSON.parse(selectedRole)
      setUserId(emailToUUID(role.email)) // 将email转换为固定的UUID

      // 使用默认设置
      const defaultSettings = {
        daily_word_count: 10,
        show_phonetic: true,
      }

      setTargetCount(defaultSettings.daily_word_count)
      setShowPhonetic(defaultSettings.show_phonetic)

      // 使用导入的词库数据 (200个词)
      const mockWords: WordCard[] = wordBank1.map((item, index) => ({
        id: String(index + 1),
        word: item.word,
        phonetic: item.phonetic,
        translation: item.translation,
        example_sentence: `Example: ${item.word} is a common ${item.category}.`,
        difficulty: item.difficulty as 'easy' | 'medium' | 'hard',
        category: item.category,
        language: 'en' as const,
        is_preset: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      // 保存完整词库
      setAllWords(mockWords)
      setWords(mockWords.slice(0, defaultSettings.daily_word_count))
      setState('ready')
    } catch (error) {
      console.error('Initialize error:', error)
      toast.error('初始化失败')
    }
  }

  const handleRecordingComplete = async (url: string, duration: number) => {
    try {
      setAudioUrl(url)
      setState('evaluating')

      const currentWord = words[currentIndex]

      if (!userId) {
        toast.error('系统错误')
        setState('ready')
        return
      }

      // 调用评测API（使用Next.js API Route）
      const response = await fetch('/api/pronunciation/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: url,
          text: currentWord.word,
          language: currentWord.language,
          category: 'read_word',
          user_id: userId,
          word_card_id: currentWord.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScores(result.scores)
        setState('result')
        setCompletedCount((prev) => prev + 1)
        // 使用得分作为伤害值，对小怪兽造成伤害
        setMonsterDamage(Math.round(result.scores.total_score))
        toast.success(`得分: ${result.scores.total_score.toFixed(1)}`)
      } else {
        toast.error('评测失败: ' + result.error)
        setState('ready')
      }
    } catch (error) {
      console.error('Evaluation error:', error)
      toast.error('评测失败')
      setState('ready')
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScores(null)
      setAudioUrl(null)
      setMonsterDamage(0)
      setState('ready')
    } else {
      setState('completed')
    }
  }

  const handleRetry = () => {
    setScores(null)
    setAudioUrl(null)
    setMonsterDamage(0)
    setState('ready')
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleDamageComplete = () => {
    // 伤害动画完成后重置伤害值
    setMonsterDamage(0)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setScores(null)
    setAudioUrl(null)
    setCompletedCount(0)
    setMonsterDamage(0)
    initializePractice()
  }

  const handleWordCountChange = (newCount: number) => {
    if (allWords.length === 0) return

    setTargetCount(newCount)
    setWords(allWords.slice(0, newCount))
    setCurrentIndex(0)
    setCompletedCount(0)
    setScores(null)
    setAudioUrl(null)
    setState('ready')
    toast.success(`已设置为 ${newCount} 个词，进度已重置`)
  }

  const currentWord = words[currentIndex]
  const progress = targetCount > 0 ? (completedCount / targetCount) * 100 : 0

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (state === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 flex items-center justify-center">
        <Card className="p-12 text-center space-y-6 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <Trophy className="h-24 w-24 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold">今日练习完成！</h2>
          <p className="text-xl text-muted-foreground">
            恭喜你完成了今天的 {completedCount} 个单词练习
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              重新开始
            </Button>
            <Button onClick={() => (window.location.href = '/')}>
              <Calendar className="h-4 w-4 mr-2" />
              查看统计
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 relative">
      {/* 可拖拽的怪兽 */}
      <div className="fixed top-24 right-8 z-50">
        <MonsterBattle damage={monsterDamage} onDamageComplete={handleDamageComplete} />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-6">
            {/* 顶部进度和设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">今日进度</h3>
                    <span className="text-sm text-muted-foreground">
                      {completedCount} / {targetCount}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </Card>

              {/* 词数选择 */}
              <Card className="p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">练习词数</h3>
                  <select
                    value={targetCount}
                    onChange={(e) => handleWordCountChange(Number(e.target.value))}
                    disabled={state === 'recording' || state === 'evaluating'}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={10}>10 个词</option>
                    <option value={20}>20 个词</option>
                    <option value={30}>30 个词</option>
                    <option value={50}>50 个词</option>
                    <option value={100}>100 个词</option>
                  </select>
                </div>
              </Card>
            </div>

            {/* 词卡展示 */}
            {currentWord && (
              <WordCardDisplay
                word={currentWord}
                showPhonetic={showPhonetic && state !== 'recording'}
                showTranslation={state === 'result'}
              />
            )}

            {/* 录音/评分区域 */}
            <Card className="p-8">
        {state === 'ready' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                请清晰地朗读上面的单词
              </p>
            </div>
            <AudioRecorderComponent
              onRecordingComplete={handleRecordingComplete}
              onError={(error) => toast.error(error)}
            />
          </div>
        )}

        {state === 'recording' && (
          <div className="space-y-6">
            <AudioRecorderComponent
              onRecordingComplete={handleRecordingComplete}
              onError={(error) => toast.error(error)}
            />
          </div>
        )}

        {state === 'evaluating' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">正在评测您的发音...</p>
          </div>
        )}

        {state === 'result' && scores && (
          <div className="space-y-6">
            <ScoreDisplay scores={scores} language={currentWord.language} />

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                重试
              </Button>
              {currentIndex < words.length - 1 ? (
                <Button onClick={handleNext}>
                  下一个
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  完成
                  <Trophy className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
            </Card>

            {/* 底部操作 */}
            {state === 'ready' && (
              <div className="flex justify-center">
                <Button onClick={handleSkip} variant="ghost" size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  跳过这个词
                </Button>
              </div>
            )}

            {/* 当前词卡位置指示器 */}
            <div className="flex justify-center gap-2">
              {words.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : index < currentIndex
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
        </div>
      </div>
    </div>
  )
}
