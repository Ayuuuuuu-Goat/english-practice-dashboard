"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Award, Target, Calendar, BarChart3, Loader2 } from 'lucide-react'
import { getPronunciationStats } from '@/lib/supabase/pronunciation-queries'
import type { PronunciationStats } from '@/lib/pronunciation/types'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { emailToUUID } from '@/lib/user-utils'

export function PronunciationStatsPage() {
  const [stats, setStats] = useState<PronunciationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // 获取当前登录用户
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        return null
      }
      const roleData = JSON.parse(selectedRole); const user = { id: emailToUUID(roleData.email), email: roleData.email }

      if (!user) {
        toast.error('请先登录')
        setStats(null)
        return
      }

      const data = await getPronunciationStats(user.id)
      setStats(data)
    } catch (error) {
      console.error('Load stats error:', error)
      // 如果没有数据，设置为null即可
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">暂无统计数据</p>
        <p className="text-sm text-muted-foreground mt-2">开始练习后这里会显示您的进度</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总练习次数 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总练习次数</p>
              <p className="text-2xl font-bold">{stats.total_attempts}</p>
            </div>
          </div>
        </Card>

        {/* 平均分 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均分数</p>
              <p className="text-2xl font-bold">{stats.avg_score.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        {/* 最高分 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Award className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最高分数</p>
              <p className="text-2xl font-bold">{stats.best_score.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        {/* 连续天数 */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">连续天数</p>
              <p className="text-2xl font-bold">{stats.current_streak}天</p>
              <p className="text-xs text-muted-foreground">最长: {stats.longest_streak}天</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">最近练习</TabsTrigger>
          <TabsTrigger value="progress">进度趋势</TabsTrigger>
          <TabsTrigger value="difficulty">难度分布</TabsTrigger>
        </TabsList>

        {/* 最近练习 */}
        <TabsContent value="recent" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">最近10次练习</h3>
            <div className="space-y-3">
              {stats.recent_attempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无练习记录</p>
              ) : (
                stats.recent_attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">单词练习</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          (attempt.total_score || 0) >= 90
                            ? 'text-green-600'
                            : (attempt.total_score || 0) >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(attempt.total_score || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">总分</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 进度趋势 */}
        <TabsContent value="progress" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">30天进度趋势</h3>
            <div className="space-y-2">
              {stats.progress_by_date.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无数据</p>
              ) : (
                stats.progress_by_date.slice(-30).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(day.avg_score, 100)}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm font-medium text-right">
                          {day.avg_score.toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-muted-foreground text-right">
                      {day.count}次
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 难度分布 */}
        <TabsContent value="difficulty" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">按难度统计</h3>
            <div className="space-y-6">
              {/* 简单 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-600">简单</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.by_difficulty.easy.count}次 · 平均{' '}
                    {stats.by_difficulty.easy.avg_score.toFixed(1)}分
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${stats.by_difficulty.easy.avg_score}%` }}
                  />
                </div>
              </div>

              {/* 中等 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-yellow-600">中等</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.by_difficulty.medium.count}次 · 平均{' '}
                    {stats.by_difficulty.medium.avg_score.toFixed(1)}分
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${stats.by_difficulty.medium.avg_score}%` }}
                  />
                </div>
              </div>

              {/* 困难 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-red-600">困难</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.by_difficulty.hard.count}次 · 平均{' '}
                    {stats.by_difficulty.hard.avg_score.toFixed(1)}分
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${stats.by_difficulty.hard.avg_score}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
