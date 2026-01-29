"use client"

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, RotateCcw, MessageSquare, TrendingUp, Award, Target, Trophy, Star } from 'lucide-react'
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

interface DialogueNode {
  id: string
  node_id: string
  speaker: string
  content: string
  character_role: string
}

interface ResponseOption {
  id: string
  option_text: string
  quality_score: number
  grammar_feedback: string | null
  better_expression: string | null
  next_node_id: string
  outcome_effect: string
}

interface ConversationMessage {
  node_id: string
  speaker: string
  content: string
  character_role: string
  selected_option?: ResponseOption
  timestamp: Date
}

interface Stats {
  total_sessions: number
  completed_sessions: number
  average_score: number
  best_outcome_count: number
}

export function ScenarioConversationPage() {
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [progressId, setProgressId] = useState<string | null>(null)
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null)
  const [responseOptions, setResponseOptions] = useState<ResponseOption[]>([])
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [finalOutcome, setFinalOutcome] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedOptionFeedback, setSelectedOptionFeedback] = useState<ResponseOption | null>(null)
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
  }, [conversationHistory, showFeedback])

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
    try {
      setSelectedScenario(scenario)
      setConversationHistory([])
      setCurrentScore(0)
      setIsCompleted(false)
      setFinalOutcome(null)

      // Create new progress record and get first node
      const response = await fetch('/api/conversation/start-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          scenario_id: scenario.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setProgressId(data.progress_id)
        setCurrentNode(data.current_node)
        setResponseOptions(data.response_options)

        // Add AI's first message to history
        setConversationHistory([{
          node_id: data.current_node.node_id,
          speaker: data.current_node.speaker,
          content: data.current_node.content,
          character_role: data.current_node.character_role,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const selectOption = async (option: ResponseOption) => {
    if (!progressId || !currentNode) return

    try {
      setShowFeedback(true)
      setSelectedOptionFeedback(option)

      // Wait for user to see feedback
      await new Promise(resolve => setTimeout(resolve, 100))

      // Update score
      const newScore = currentScore + option.quality_score
      setCurrentScore(newScore)

      // Add user's choice to history
      const userMessage: ConversationMessage = {
        node_id: currentNode.node_id,
        speaker: 'user',
        content: option.option_text,
        character_role: 'you',
        selected_option: option,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, userMessage])

      // Move to next node
      const response = await fetch('/api/conversation/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_id: progressId,
          selected_option_id: option.id,
          current_score: newScore
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.is_completed) {
          // Conversation ended
          setIsCompleted(true)
          setFinalOutcome(data.final_outcome)
          setCurrentNode(null)
          setResponseOptions([])

          // Add final AI message if exists
          if (data.final_node) {
            setConversationHistory(prev => [...prev, {
              node_id: data.final_node.node_id,
              speaker: data.final_node.speaker,
              content: data.final_node.content,
              character_role: data.final_node.character_role,
              timestamp: new Date()
            }])
          }

          loadStats()
        } else {
          // Continue conversation
          setCurrentNode(data.next_node)
          setResponseOptions(data.response_options)

          // Add AI's response to history
          setConversationHistory(prev => [...prev, {
            node_id: data.next_node.node_id,
            speaker: data.next_node.speaker,
            content: data.next_node.content,
            character_role: data.next_node.character_role,
            timestamp: new Date()
          }])
        }

        setShowFeedback(false)
        setSelectedOptionFeedback(null)
      }
    } catch (error) {
      console.error('Error selecting option:', error)
      toast.error('Failed to process selection')
      setShowFeedback(false)
      setSelectedOptionFeedback(null)
    }
  }

  const resetConversation = () => {
    setSelectedScenario(null)
    setProgressId(null)
    setCurrentNode(null)
    setResponseOptions([])
    setConversationHistory([])
    setCurrentScore(0)
    setIsCompleted(false)
    setFinalOutcome(null)
    setShowFeedback(false)
    setSelectedOptionFeedback(null)
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
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          💬 AI 场景对话
        </h2>
        <p className="text-gray-600 mt-2 text-base">
          模拟真实工作场景：面试、会议、汇报、谈判 - 选择对话选项，触发不同结局
        </p>
      </div>

      {/* Stats */}
      {stats && !selectedScenario && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600 font-medium">总对话</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total_sessions}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">已完成</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completed_sessions}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600 font-medium">平均分</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {stats.average_score ? stats.average_score.toFixed(0) : '0'}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600 font-medium">最佳结局</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.best_outcome_count}</p>
          </Card>
        </div>
      )}

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

                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  开始对话 →
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
              <Button variant="outline" onClick={resetConversation}>
                <RotateCcw className="h-4 w-4 mr-2" />
                重新开始
              </Button>
            </div>

            {/* Score Progress */}
            {!isCompleted && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">对话进度分数</span>
                  <span className="font-bold text-indigo-600">{currentScore} / 300</span>
                </div>
                <Progress value={(currentScore / 300) * 100} className="h-2" />
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
                    {message.speaker !== 'user' && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {message.character_role}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    {/* Feedback for user's selection */}
                    {message.speaker === 'user' && message.selected_option && (
                      <div className="mt-3 pt-3 border-t border-white/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">质量评分:</span>
                          <Badge className="bg-white text-indigo-600">
                            +{message.selected_option.quality_score}
                          </Badge>
                          <Badge className={`${
                            message.selected_option.outcome_effect === 'positive' ? 'bg-green-500' :
                            message.selected_option.outcome_effect === 'neutral' ? 'bg-blue-500' :
                            'bg-red-500'
                          } text-white`}>
                            {message.selected_option.outcome_effect === 'positive' ? '积极' :
                             message.selected_option.outcome_effect === 'neutral' ? '中性' : '消极'}
                          </Badge>
                        </div>

                        {message.selected_option.grammar_feedback && (
                          <div className="mt-2 bg-white/20 rounded-lg p-2">
                            <p className="text-xs font-medium mb-1">📝 语法建议:</p>
                            <p className="text-xs">{message.selected_option.grammar_feedback}</p>
                          </div>
                        )}

                        {message.selected_option.better_expression && (
                          <div className="mt-2 bg-white/20 rounded-lg p-2">
                            <p className="text-xs font-medium mb-1">💡 更好的表达:</p>
                            <p className="text-xs italic">&quot;{message.selected_option.better_expression}&quot;</p>
                          </div>
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

              <div ref={messagesEndRef} />
            </div>

            {/* Response Options */}
            {!isCompleted && responseOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  选择你的回复 (点击选项继续对话):
                </p>
                {responseOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectOption(option)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 rounded-xl border-2 border-gray-200 bg-white transition-all hover:scale-[1.02] hover:shadow-md hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      showFeedback && selectedOptionFeedback?.id === option.id
                        ? 'ring-4 ring-indigo-300 border-indigo-400'
                        : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {option.option_text}
                    </p>
                    {showFeedback && selectedOptionFeedback?.id === option.id && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <Badge className="mb-2">
                          +{option.quality_score} 分
                        </Badge>
                        {option.grammar_feedback && (
                          <p className="text-xs text-gray-600 mt-1">
                            💬 {option.grammar_feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
