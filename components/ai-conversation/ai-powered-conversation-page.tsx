"use client"

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, RotateCcw, MessageSquare, TrendingUp, Award, Target, Trophy, Star, Sparkles, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { emailToUUID } from '@/lib/user-utils'

interface Scenario {
  id: string
  scenario_type: string
  title: string
  description: string
  icon: string
  difficulty: string
  initial_context: string
}

interface ResponseOption {
  option_text: string
  quality_level: string
  quality_score: number
  translation?: string
  showTranslation?: boolean
  translating?: boolean
}

interface ConversationMessage {
  speaker: string
  content: string
  evaluation?: any
  timestamp: Date
  translation?: string
  showTranslation?: boolean
  translating?: boolean
}

interface Stats {
  total_sessions: number
  completed_sessions: number
  average_score: number
  best_outcome_count: number
}

export function AIPoweredConversationPage() {
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [responseOptions, setResponseOptions] = useState<ResponseOption[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [turnCount, setTurnCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [finalOutcome, setFinalOutcome] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [processing, setProcessing] = useState(false)
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
  }, [conversationHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversation/scenarios/list')
      const data = await response.json()

      if (data.success) {
        setScenarios(data.scenarios)
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      toast.error('Failed to load scenarios')
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
    setSelectedScenario(scenario)
    setConversationHistory([])
    setCurrentScore(0)
    setTurnCount(0)
    setIsCompleted(false)
    setFinalOutcome(null)
    setProcessing(true)

    try {
      // Get initial AI greeting
      const response = await fetch('/api/conversation/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario,
          conversation_history: [],
          user_message: '[START_CONVERSATION]'
        })
      })

      const data = await response.json()

      if (data.success) {
        setConversationHistory([{
          speaker: 'ai',
          content: data.ai_response,
          timestamp: new Date()
        }])
        setResponseOptions(data.response_options || [])
      } else {
        toast.error('Failed to start conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    } finally {
      setProcessing(false)
    }
  }

  const selectOption = async (option: ResponseOption) => {
    if (processing || !selectedScenario) return

    setProcessing(true)

    try {
      // Add user message to history
      const userMessage: ConversationMessage = {
        speaker: 'user',
        content: option.option_text,
        timestamp: new Date()
      }

      const updatedHistory = [...conversationHistory, userMessage]
      setConversationHistory(updatedHistory)

      // Update score
      const newScore = currentScore + option.quality_score
      setCurrentScore(newScore)
      setTurnCount(turnCount + 1)

      // Get AI response
      const response = await fetch('/api/conversation/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          conversation_history: updatedHistory,
          user_message: option.option_text
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add evaluation to user message
        const updatedHistoryWithEval = [...updatedHistory]
        updatedHistoryWithEval[updatedHistoryWithEval.length - 1].evaluation = data.evaluation

        // Add AI response
        const aiMessage: ConversationMessage = {
          speaker: 'ai',
          content: data.ai_response,
          timestamp: new Date()
        }

        setConversationHistory([...updatedHistoryWithEval, aiMessage])

        // Continue conversation (don't auto-end)
        // User can manually end by clicking "结束对话" button
        setResponseOptions(data.response_options || [])
      } else {
        toast.error('Failed to process response')
      }
    } catch (error) {
      console.error('Error selecting option:', error)
      toast.error('Failed to process response')
    } finally {
      setProcessing(false)
    }
  }

  const determineFinalOutcome = (avgScore: number): string => {
    if (avgScore >= 85) return 'promotion'
    if (avgScore >= 65) return 'neutral'
    return 'failed'
  }

  const saveSessionResult = async (totalScore: number, turns: number, outcome: string) => {
    try {
      const response = await fetch('/api/conversation/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          scenario_id: selectedScenario?.id,
          total_score: totalScore,
          turns: turns,
          final_outcome: outcome,
          conversation_history: conversationHistory
        })
      })

      if (!response.ok) {
        console.error('Failed to save session result')
      }
    } catch (error) {
      console.error('Error saving result:', error)
    }
  }

  const endConversation = async () => {
    if (turnCount === 0) {
      // No turns yet, just reset
      resetConversation()
      return
    }

    // Calculate final outcome
    const avgScore = currentScore / turnCount
    const outcome = determineFinalOutcome(avgScore)

    // Save results
    await saveSessionResult(currentScore, turnCount, outcome)

    // Show completion screen
    setIsCompleted(true)
    setFinalOutcome(outcome)
    setResponseOptions([])

    // Update stats
    loadStats()
  }

  const resetConversation = () => {
    setSelectedScenario(null)
    setConversationHistory([])
    setResponseOptions([])
    setCurrentScore(0)
    setTurnCount(0)
    setIsCompleted(false)
    setFinalOutcome(null)
  }

  const translateMessage = async (messageIndex: number) => {
    const message = conversationHistory[messageIndex]

    // If already translated, toggle visibility
    if (message.translation) {
      const updatedHistory = [...conversationHistory]
      updatedHistory[messageIndex].showTranslation = !message.showTranslation
      setConversationHistory(updatedHistory)
      return
    }

    // Start translating
    const updatedHistory = [...conversationHistory]
    updatedHistory[messageIndex].translating = true
    setConversationHistory(updatedHistory)

    try {
      const response = await fetch('/api/conversation/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content })
      })

      const data = await response.json()

      if (data.success) {
        const finalHistory = [...conversationHistory]
        finalHistory[messageIndex].translation = data.translation
        finalHistory[messageIndex].showTranslation = true
        finalHistory[messageIndex].translating = false
        setConversationHistory(finalHistory)
      } else {
        toast.error('翻译失败')
        const finalHistory = [...conversationHistory]
        finalHistory[messageIndex].translating = false
        setConversationHistory(finalHistory)
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('翻译失败')
      const finalHistory = [...conversationHistory]
      finalHistory[messageIndex].translating = false
      setConversationHistory(finalHistory)
    }
  }

  const translateOption = async (optionIndex: number) => {
    const option = responseOptions[optionIndex]

    // If already translated, toggle visibility
    if (option.translation) {
      const updatedOptions = [...responseOptions]
      updatedOptions[optionIndex].showTranslation = !option.showTranslation
      setResponseOptions(updatedOptions)
      return
    }

    // Start translating
    const updatedOptions = [...responseOptions]
    updatedOptions[optionIndex].translating = true
    setResponseOptions(updatedOptions)

    try {
      const response = await fetch('/api/conversation/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: option.option_text })
      })

      const data = await response.json()

      if (data.success) {
        const finalOptions = [...responseOptions]
        finalOptions[optionIndex].translation = data.translation
        finalOptions[optionIndex].showTranslation = true
        finalOptions[optionIndex].translating = false
        setResponseOptions(finalOptions)
      } else {
        toast.error('翻译失败')
        const finalOptions = [...responseOptions]
        finalOptions[optionIndex].translating = false
        setResponseOptions(finalOptions)
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('翻译失败')
      const finalOptions = [...responseOptions]
      finalOptions[optionIndex].translating = false
      setResponseOptions(finalOptions)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return difficulty
    }
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'promotion':
      case 'raise':
      case 'deal_success':
        return <Trophy className="h-12 w-12 text-yellow-500" />
      case 'neutral':
        return <Star className="h-12 w-12 text-blue-500" />
      default:
        return <MessageSquare className="h-12 w-12 text-gray-500" />
    }
  }

  const getOutcomeMessage = (outcome: string) => {
    switch (outcome) {
      case 'promotion':
        return { title: '🎉 获得晋升！', message: '你的出色表现赢得了晋升机会！', color: 'text-yellow-600' }
      case 'raise':
        return { title: '💰 获得加薪！', message: '你的专业能力获得了认可，加薪15%！', color: 'text-green-600' }
      case 'deal_success':
        return { title: '🤝 交易成功！', message: '恭喜！你成功达成了合作协议！', color: 'text-blue-600' }
      case 'neutral':
        return { title: '✅ 顺利完成', message: '你完成了对话，表现不错！', color: 'text-blue-600' }
      case 'failed':
        return { title: '😔 需要改进', message: '这次表现有待提高，继续加油！', color: 'text-gray-600' }
      default:
        return { title: '对话结束', message: '感谢参与！', color: 'text-gray-600' }
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            💬 AI 场景对话
          </h2>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            AI 驱动
          </Badge>
        </div>
        <p className="text-gray-600 mt-2 text-base">
          由 OpenAI GPT-4 驱动的实时对话练习 - 每次对话都是独特的体验
        </p>
      </div>


      {/* Scenario Selection or Conversation */}
      {!selectedScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => startConversation(scenario)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{scenario.icon}</span>
                    <div>
                      <h3 className="font-bold text-xl">{scenario.title}</h3>
                      <Badge className={`mt-1 ${getDifficultyColor(scenario.difficulty)}`}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{scenario.description}</p>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">📖 情境背景：</p>
                  <p className="text-xs text-gray-700 italic">{scenario.initial_context}</p>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  开始 AI 对话 →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Conversation Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{selectedScenario.icon}</span>
                <div>
                  <h3 className="font-bold text-xl">{selectedScenario.title}</h3>
                  <p className="text-sm text-gray-500">{selectedScenario.description}</p>
                </div>
              </div>
              {!isCompleted ? (
                <Button variant="outline" onClick={endConversation}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  结束对话
                </Button>
              ) : (
                <Button variant="outline" onClick={resetConversation}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重新开始
                </Button>
              )}
            </div>

            {/* Score Progress */}
            {!isCompleted && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">对话进度 (第 {turnCount + 1} 轮)</span>
                  <span className="font-bold text-indigo-600">{currentScore} 分</span>
                </div>
                <Progress value={Math.min((turnCount / 5) * 100, 100)} className="h-2" />
              </div>
            )}
          </Card>

          {/* Conversation Area */}
          <Card className="p-6">
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
              {conversationHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 ${
                      message.speaker === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    {/* Evaluation for user messages */}
                    {message.speaker === 'user' && message.evaluation && (
                      <div className="mt-3 pt-3 border-t border-white/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">质量评分:</span>
                          <Badge className="bg-white text-indigo-600">
                            {message.evaluation.overall_score}/100
                          </Badge>
                        </div>

                        {message.evaluation.feedback && (
                          <p className="text-xs mt-2 text-white/90">
                            💬 {message.evaluation.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Completion Screen */}
              {isCompleted && finalOutcome && (
                <div className="flex justify-center">
                  <Card className="p-8 max-w-md w-full text-center space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="flex justify-center">
                      {getOutcomeIcon(finalOutcome)}
                    </div>
                    <h3 className={`text-2xl font-bold ${getOutcomeMessage(finalOutcome).color}`}>
                      {getOutcomeMessage(finalOutcome).title}
                    </h3>
                    <p className="text-gray-700">
                      {getOutcomeMessage(finalOutcome).message}
                    </p>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">最终得分</p>
                      <p className="text-4xl font-bold text-indigo-600">{currentScore}</p>
                      <p className="text-sm text-gray-500 mt-1">平均 {Math.round(currentScore / turnCount)}/100 每轮</p>
                    </div>
                    <Button
                      onClick={resetConversation}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                      再玩一次
                    </Button>
                  </Card>
                </div>
              )}

              {processing && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">AI 正在思考...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Response Options */}
            {!isCompleted && !processing && responseOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  选择你的回复 (由 AI 实时生成):
                </p>
                {responseOptions.map((option, idx) => (
                  <div key={idx} className="relative">
                    <button
                      onClick={() => selectOption(option)}
                      className="w-full text-left p-4 rounded-xl border-2 border-gray-200 bg-white transition-all hover:scale-[1.02] hover:shadow-md hover:border-indigo-300"
                    >
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {option.option_text}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
