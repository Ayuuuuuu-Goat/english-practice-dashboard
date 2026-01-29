"use client"

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star, Target, Zap, CheckCircle2 } from 'lucide-react'

interface ScoreDisplayProps {
  scores: {
    total_score: number
    accuracy_score: number
    fluency_score: number
    integrity_score: number
    phone_score?: number
    tone_score?: number
  }
  language?: 'en' | 'zh'
}

export function ScoreDisplay({ scores, language = 'en' }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'bg-green-500' }
    if (score >= 80) return { grade: 'B', color: 'bg-blue-500' }
    if (score >= 70) return { grade: 'C', color: 'bg-yellow-500' }
    if (score >= 60) return { grade: 'D', color: 'bg-orange-500' }
    return { grade: 'F', color: 'bg-red-500' }
  }

  const scoreGrade = getScoreGrade(scores.total_score)

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 总分 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <h3 className="text-lg font-semibold">总分</h3>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(scores.total_score)}`}>
              {scores.total_score.toFixed(1)}
            </div>
            <div
              className={`text-4xl font-bold text-white ${scoreGrade.color} rounded-full w-16 h-16 flex items-center justify-center`}
            >
              {scoreGrade.grade}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">满分 100</p>
        </div>

        {/* 分项得分 */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-sm text-muted-foreground">详细评分</h4>

          {/* 准确度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">准确度</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(scores.accuracy_score)}`}>
                {scores.accuracy_score.toFixed(1)}
              </span>
            </div>
            <Progress value={scores.accuracy_score} className="h-2" />
          </div>

          {/* 流利度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">流利度</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(scores.fluency_score)}`}>
                {scores.fluency_score.toFixed(1)}
              </span>
            </div>
            <Progress value={scores.fluency_score} className="h-2" />
          </div>

          {/* 完整度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">完整度</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(scores.integrity_score)}`}>
                {scores.integrity_score.toFixed(1)}
              </span>
            </div>
            <Progress value={scores.integrity_score} className="h-2" />
          </div>

          {/* 中文特有：音素分和声调分 */}
          {language === 'zh' && scores.phone_score !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">音素分</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.phone_score)}`}>
                  {scores.phone_score.toFixed(1)}
                </span>
              </div>
              <Progress value={scores.phone_score} className="h-2" />
            </div>
          )}

          {language === 'zh' && scores.tone_score !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">声调分</span>
                <span className={`text-sm font-bold ${getScoreColor(scores.tone_score)}`}>
                  {scores.tone_score.toFixed(1)}
                </span>
              </div>
              <Progress value={scores.tone_score} className="h-2" />
            </div>
          )}
        </div>

        {/* 评价 */}
        <div className="pt-4 border-t">
          <p className="text-sm text-center text-muted-foreground">
            {scores.total_score >= 90 && '🎉 太棒了！发音非常标准！'}
            {scores.total_score >= 70 && scores.total_score < 90 && '👍 不错！继续加油！'}
            {scores.total_score >= 60 && scores.total_score < 70 && '💪 还需要多加练习哦'}
            {scores.total_score < 60 && '📚 建议多听多练，慢慢来'}
          </p>
        </div>
      </div>
    </Card>
  )
}
