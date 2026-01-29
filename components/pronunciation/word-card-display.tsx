"use client"

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WordCard } from '@/lib/pronunciation/types'

interface WordCardDisplayProps {
  word: WordCard
  showPhonetic?: boolean
  showTranslation?: boolean
}

export function WordCardDisplay({ word, showPhonetic = true, showTranslation = true }: WordCardDisplayProps) {
  const playAudio = () => {
    // 使用浏览器的语音合成API播放单词
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = word.language === 'en' ? 'en-US' : 'zh-CN'
      utterance.rate = 0.8 // 稍慢速度便于学习
      window.speechSynthesis.speak(utterance)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-700 border-green-300'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-300'
      case 'hard':
        return 'bg-red-500/10 text-red-700 border-red-300'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-300'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return difficulty
    }
  }

  return (
    <Card className="p-8 text-center space-y-6">
      {/* 难度和分类标签 */}
      <div className="flex justify-center gap-2">
        <Badge variant="outline" className={getDifficultyColor(word.difficulty)}>
          {getDifficultyLabel(word.difficulty)}
        </Badge>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">
          {word.category}
        </Badge>
      </div>

      {/* 单词 */}
      <div className="space-y-2">
        <h2 className="text-5xl font-bold text-primary">{word.word}</h2>

        {/* 播放发音按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={playAudio}
          className="text-muted-foreground hover:text-primary"
        >
          <Volume2 className="h-4 w-4 mr-1" />
          听发音
        </Button>
      </div>

      {/* 音标 */}
      {showPhonetic && word.phonetic && (
        <p className="text-2xl text-muted-foreground font-mono">{word.phonetic}</p>
      )}

      {/* 中文释义 */}
      {showTranslation && word.translation && (
        <p className="text-xl text-foreground">{word.translation}</p>
      )}

      {/* 例句 */}
      {word.example_sentence && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-1">例句</p>
          <p className="text-base italic">{word.example_sentence}</p>
        </div>
      )}
    </Card>
  )
}
