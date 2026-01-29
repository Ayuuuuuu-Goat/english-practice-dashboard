"use client"

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, RotateCcw, MessageSquare, TrendingUp, Award, Target } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { emailToUUID } from '@/lib/user-utils'

interface Scenario {
  id: string
  name: string
  name_en: string
  category: string
  difficulty: string
  icon: string
  description: string
  system_prompt: string
  initial_message: string
  tips: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  overall_score?: number
  corrections?: Array<{ original: string; corrected: string; explanation: string }>
  suggestions?: Array<{ current: string; better: string; explanation: string }>
  feedback?: string
}

interface Stats {
  total_conversations: number
  completed_conversations: number
  average_score: number
  current_streak: number
}

export function AIConversationPage() {
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [userId, setUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
      loadScenarios()
      loadStats()
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversation/scenarios')
      const data = await response.json()

      if (data.success) {
        setScenarios(data.scenarios)
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      toast.error('加载场景失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/conversation/stats?user_id=${userId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const startConversation = async (scenario: Scenario) => {
    try {
      setSelectedScenario(scenario)
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: scenario.initial_message
      }])

      // 创建新对话会话
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          scenario_id: scenario.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setConversationId(data.conversation_id)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('启动对话失败')
    }
  }

  const sendMessage = async () => {
    if (!userInput.trim() || !conversationId) return

    const userMessage = userInput.trim()
    setUserInput('')
    setSending(true)

    // 添加用户消息到界面
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    }])

    try {
      const response = await fetch('/api/conversation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: userMessage,
          scenario: selectedScenario
        })
      })

      const data = await response.json()

      if (data.success) {
        // 更新用户消息（添加评分和反馈）
        setMessages(prev => prev.map((msg, idx) =>
          idx === prev.length - 1
            ? {
                ...msg,
                overall_score: data.evaluation.overall_score,
                corrections: data.evaluation.corrections,
                suggestions: data.evaluation.suggestions,
                feedback: data.evaluation.feedback
              }
            : msg
        ))

        // 添加 AI 回复
        setMessages(prev => [...prev, {
          id: data.message_id,
          role: 'assistant',
          content: data.ai_response
        }])

        // 刷新统计
        loadStats()
      } else {
        toast.error('发送失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  const endConversation = async () => {
    if (!conversationId) return

    try {
      await fetch('/api/conversation/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId })
      })

      setSelectedScenario(null)
      setConversationId(null)
      setMessages([])
      loadStats()
      toast.success('对话已结束')
    } catch (error) {
      console.error('Error ending conversation:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级'
      case 'intermediate': return '中级'
      case 'advanced': return '高级'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          AI 场景对话
        </h2>
        <p className="text-gray-600 mt-2 text-base">
          模拟真实工作场景，与 AI 进行英语对话练习，获得即时反馈和改进建议
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && !selectedScenario && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600 font-medium">总对话</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total_conversations}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">完成</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completed_conversations}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600 font-medium">平均分</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {stats.average_score ? stats.average_score.toFixed(1) : '0'}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600 font-medium">连续天数</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.current_streak}</p>
          </Card>
        </div>
      )}

      {/* 场景选择或对话界面 */}
      {!selectedScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => startConversation(scenario)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{scenario.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{scenario.name}</h3>
                      <p className="text-sm text-gray-500">{scenario.name_en}</p>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                    {getDifficultyLabel(scenario.difficulty)}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600">{scenario.description}</p>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">💡 学习要点：</p>
                  <ul className="space-y-1">
                    {scenario.tips?.slice(0, 2).map((tip, idx) => (
                      <li key={idx} className="text-xs text-gray-600">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full">
                  开始对话 →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 对话头部 */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{selectedScenario.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{selectedScenario.name}</h3>
                  <p className="text-sm text-gray-500">{selectedScenario.description}</p>
                </div>
              </div>
              <Button variant="outline" onClick={endConversation}>
                <RotateCcw className="h-4 w-4 mr-2" />
                结束对话
              </Button>
            </div>

            {/* 提示 */}
            {selectedScenario.tips && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">💡 对话提示：</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedScenario.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-blue-700">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* 对话区域 */}
          <Card className="p-6">
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* 用户消息的评分和反馈 */}
                    {message.role === 'user' && message.overall_score && (
                      <div className="mt-3 pt-3 border-t border-indigo-400/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">评分:</span>
                          <Badge className="bg-white text-indigo-600">
                            {message.overall_score}/100
                          </Badge>
                        </div>

                        {message.feedback && (
                          <p className="text-sm mt-2 text-indigo-100">
                            💬 {message.feedback}
                          </p>
                        )}

                        {message.corrections && message.corrections.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">语法纠正:</p>
                            {message.corrections.map((corr, i) => (
                              <div key={i} className="text-xs bg-indigo-600/30 rounded p-2 mb-1">
                                <p>❌ {corr.original}</p>
                                <p>✅ {corr.corrected}</p>
                                <p className="text-indigo-200">{corr.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">更好的表达:</p>
                            {message.suggestions.map((sug, i) => (
                              <div key={i} className="text-xs bg-indigo-600/30 rounded p-2 mb-1">
                                <p>💡 {sug.better}</p>
                                <p className="text-indigo-200">{sug.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="flex gap-3">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="输入你的回复... (Enter 发送，Shift+Enter 换行)"
                className="flex-1"
                rows={3}
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !userInput.trim()}
                className="px-6"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    发送
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
