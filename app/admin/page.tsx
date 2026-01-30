"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Target, Users, Video, Newspaper, MessageSquare, TrendingUp, ArrowUp, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts'

interface UserStats {
  userId: string
  email: string
  roleName: string
  displayName: string
  totalMinutes: number
  lastActiveDate: string | null
  pronunciation: {
    totalPractices: number
    avgScore: number
    totalMinutes: number
  }
  video: {
    totalWatched: number
    totalMinutes: number
    currentStreak: number
  }
  hn: {
    totalRead: number
    currentStreak: number
  }
  conversation: {
    totalSessions: number
    avgScore: number
  }
}

const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  purple: '#722ed1',
  cyan: '#13c2c2',
}

export default function AdminDashboard() {
  const [allUsersStats, setAllUsersStats] = useState<UserStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('week')
  const [timelineData, setTimelineData] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkViewer()
    fetchAllUsersStats()
    fetchTimelineStats()
  }, [])

  useEffect(() => {
    fetchTimelineStats()
  }, [timePeriod])

  const checkViewer = () => {
    try {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        router.push('/login')
        return
      }

      const role = JSON.parse(selectedRole)
      if (role.name.toLowerCase() !== 'viewer') {
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking role:', error)
      router.push('/')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('selectedRole')
    router.push('/login')
  }

  const fetchAllUsersStats = async () => {
    try {
      const res = await fetch('/api/admin/all-users-stats')
      const data = await res.json()

      if (data.success) {
        setAllUsersStats(data.stats)
        if (data.stats.length > 0) {
          setSelectedUser(data.stats[0])
        }
      } else {
        console.error('Failed to fetch stats:', data.error)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimelineStats = async () => {
    try {
      const res = await fetch(`/api/admin/timeline-stats?period=${timePeriod}`)
      const data = await res.json()

      if (data.success) {
        setTimelineData(data.data)
      } else {
        console.error('Failed to fetch timeline stats:', data.error)
      }
    } catch (error) {
      console.error('Error fetching timeline stats:', error)
    }
  }

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'gina': '#eb2f96',
      'justin': '#1890ff',
      'goat': '#52c41a',
      'ethan': '#722ed1',
      'viewer': '#fa8c16'
    }
    return colors[roleName.toLowerCase()] || '#8c8c8c'
  }

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, string> = {
      'gina': '👩',
      'justin': '👨',
      'goat': '🐐',
      'ethan': '👦',
      'viewer': '👀'
    }
    return icons[roleName.toLowerCase()] || '👤'
  }

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return '从未'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  // 计算总体统计
  const totalStats = allUsersStats.reduce((acc, stat) => ({
    totalMinutes: acc.totalMinutes + stat.totalMinutes,
    totalPractices: acc.totalPractices + stat.pronunciation.totalPractices,
    totalVideos: acc.totalVideos + stat.video.totalWatched,
    totalHnReads: acc.totalHnReads + stat.hn.totalRead,
    totalConversations: acc.totalConversations + stat.conversation.totalSessions,
    avgScore: acc.avgScore + stat.pronunciation.avgScore
  }), {
    totalMinutes: 0,
    totalPractices: 0,
    totalVideos: 0,
    totalHnReads: 0,
    totalConversations: 0,
    avgScore: 0
  })

  // 准备图表数据
  const timeComparisonData = allUsersStats.map(stat => ({
    name: stat.displayName,
    发音: stat.pronunciation.totalMinutes,
    视频: stat.video.totalMinutes,
    总计: stat.totalMinutes
  }))

  const scoreComparisonData = allUsersStats.map(stat => ({
    name: stat.displayName,
    发音: stat.pronunciation.avgScore,
    对话: stat.conversation.avgScore
  }))

  const activityData = allUsersStats.map(stat => ({
    name: stat.displayName,
    发音练习: stat.pronunciation.totalPractices,
    视频观看: stat.video.totalWatched,
    HN阅读: stat.hn.totalRead,
    AI对话: stat.conversation.totalSessions
  }))

  // 雷达图数据
  const radarData = selectedUser ? [
    { subject: '发音分数', value: selectedUser.pronunciation.avgScore, fullMark: 100 },
    { subject: '对话分数', value: selectedUser.conversation.avgScore, fullMark: 100 },
    { subject: '视频连续', value: selectedUser.video.currentStreak * 10, fullMark: 100 },
    { subject: 'HN连续', value: selectedUser.hn.currentStreak * 10, fullMark: 100 },
    { subject: '活跃度', value: Math.min(100, selectedUser.totalMinutes / 10), fullMark: 100 }
  ] : []

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* 顶部标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">数据分析</h1>
            <p className="text-sm text-gray-500 mt-1">团队学习数据总览</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 时间维度选择器 */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
              {[
                { value: 'week', label: '周' },
                { value: 'month', label: '月' },
                { value: 'quarter', label: '季' },
                { value: 'year', label: '年' }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value as any)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timePeriod === period.value
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        {/* 顶部指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总学习时长</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{totalStats.totalMinutes}</p>
                <p className="text-xs text-gray-400 mt-1">分钟</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-7 w-7 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">12%</span>
              <span className="text-gray-400 ml-2">较上周</span>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">发音练习</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{totalStats.totalPractices}</p>
                <p className="text-xs text-gray-400 mt-1">次</p>
              </div>
              <div className="w-14 h-14 bg-pink-50 rounded-lg flex items-center justify-center">
                <Target className="h-7 w-7 text-pink-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">8%</span>
              <span className="text-gray-400 ml-2">较上周</span>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">视频观看</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{totalStats.totalVideos}</p>
                <p className="text-xs text-gray-400 mt-1">个</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center">
                <Video className="h-7 w-7 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">15%</span>
              <span className="text-gray-400 ml-2">较上周</span>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均分数</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {allUsersStats.length > 0 ? (totalStats.avgScore / allUsersStats.length).toFixed(1) : 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">分</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">5%</span>
              <span className="text-gray-400 ml-2">较上周</span>
            </div>
          </Card>
        </div>

        {/* 时间趋势图表 */}
        <Card className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              学习趋势分析
              <span className="text-sm font-normal text-gray-500">
                - {timePeriod === 'week' ? '近7天' : timePeriod === 'month' ? '近30天' : timePeriod === 'quarter' ? '近3个月' : '近1年'}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 学习时长趋势 */}
            <div>
              <p className="text-sm text-gray-600 mb-4">学习时长趋势（分钟）</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="totalMinutes" stroke="#1890ff" fill="#1890ff" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 练习次数趋势 */}
            <div>
              <p className="text-sm text-gray-600 mb-4">练习次数趋势</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="totalPractices" stroke="#eb2f96" fill="#eb2f96" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 活跃用户趋势 */}
            <div>
              <p className="text-sm text-gray-600 mb-4">活跃用户趋势</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="activeUsers" stroke="#52c41a" fill="#52c41a" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 平均分数趋势 */}
            <div>
              <p className="text-sm text-gray-600 mb-4">平均分数趋势</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <YAxis domain={[0, 100]} stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="avgScore" stroke="#722ed1" fill="#722ed1" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 用户详细数据区域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：用户列表 */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  用户详细数据
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {allUsersStats.map((stat) => (
                  <div
                    key={stat.userId}
                    onClick={() => setSelectedUser(stat)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedUser?.userId === stat.userId
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${getRoleColor(stat.roleName)}20` }}
                      >
                        {getRoleIcon(stat.roleName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{stat.displayName}</p>
                        <p className="text-xs text-gray-500">{formatLastActive(stat.lastActiveDate)}</p>
                      </div>
                      {selectedUser?.userId === stat.userId && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded">
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">分钟</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{stat.totalMinutes}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                          <Target className="h-3 w-3" />
                          <span className="text-xs">练习</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{stat.pronunciation.totalPractices}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          平均分
                        </span>
                        <span className="font-medium text-gray-900">{stat.pronunciation.avgScore.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          视频
                        </span>
                        <span className="font-medium text-gray-900">{stat.video.totalWatched} 个</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Newspaper className="h-3 w-3" />
                          HN阅读
                        </span>
                        <span className="font-medium text-gray-900">{stat.hn.totalRead} 篇</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          AI对话
                        </span>
                        <span className="font-medium text-gray-900">{stat.conversation.totalSessions} 次</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧：综合能力分析 */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-white border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                综合能力分析
                {selectedUser && <span className="text-sm font-normal text-gray-500">- {selectedUser.displayName}</span>}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#8c8c8c" style={{ fontSize: '14px' }} />
                  <PolarRadiusAxis stroke="#8c8c8c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Radar
                    name={selectedUser?.displayName}
                    dataKey="value"
                    stroke="#722ed1"
                    fill="#722ed1"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
