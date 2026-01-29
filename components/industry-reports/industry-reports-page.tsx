"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, BookOpen, PenTool, MessageCircle, Loader2, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { emailToUUID } from '@/lib/user-utils'

interface Report {
  id: string
  title: string
  category: string
  summary: string
  difficulty: string
  reading_time_minutes: number
  week_number: number
  year: number
  content: string
}

interface Vocabulary {
  id: string
  word: string
  phonetic: string
  definition_en: string
  definition_cn: string
  example_sentence: string
  word_type: string
  difficulty: string
}

interface DiscussionQuestion {
  id: string
  question: string
  question_type: string
  sample_answer: string
}

export function IndustryReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [questions, setQuestions] = useState<DiscussionQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reading')
  const [summaryText, setSummaryText] = useState('')
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [showSampleAnswer, setShowSampleAnswer] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    if (selectedReport) {
      loadReportDetails(selectedReport.id)
    }
  }, [selectedReport])

  const loadReports = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('industry_reports')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
      if (data && data.length > 0) {
        setSelectedReport(data[0])
      }
    } catch (error) {
      console.error('加载报告失败:', error)
      toast.error('加载报告失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchReports = async () => {
    setFetching(true)
    toast.loading('正在抓取最新报告...', { id: 'fetching' })

    try {
      const response = await fetch('/api/reports/fetch', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`成功抓取 ${data.count} 篇报告！`, { id: 'fetching' })
        await loadReports()
      } else {
        toast.error('抓取失败: ' + data.error, { id: 'fetching' })
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('抓取失败', { id: 'fetching' })
    } finally {
      setFetching(false)
    }
  }

  const loadReportDetails = async (reportId: string) => {
    try {
      const supabase = createClient()

      // 加载词汇
      const { data: vocabData, error: vocabError } = await supabase
        .from('report_vocabulary')
        .select('*')
        .eq('report_id', reportId)
        .order('order_index')

      if (vocabError) throw vocabError
      setVocabulary(vocabData || [])

      // 加载讨论问题
      const { data: questionsData, error: questionsError } = await supabase
        .from('report_discussion_questions')
        .select('*')
        .eq('report_id', reportId)
        .order('order_index')

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      // 初始化答案对象
      const initialAnswers: { [key: string]: string } = {}
      questionsData?.forEach(q => {
        initialAnswers[q.id] = ''
      })
      setAnswers(initialAnswers)

    } catch (error) {
      console.error('加载报告详情失败:', error)
      toast.error('加载报告详情失败')
    }
  }

  const handleSubmitSummary = async () => {
    if (!summaryText.trim()) {
      toast.error('请输入摘要内容')
      return
    }

    try {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        return null
      }
      const roleData = JSON.parse(selectedRole); const user = { id: emailToUUID(roleData.email), email: roleData.email }
      if (!user) {
        toast.error('请先登录')
        return
      }

      // 调用AI评分API
      const response = await fetch('/api/reports/evaluate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: selectedReport?.id,
          summary_text: summaryText,
          user_id: user.id
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`摘要已提交！得分: ${result.score}`)
        setActiveTab('discussion')
      } else {
        toast.error('提交失败')
      }
    } catch (error) {
      console.error('提交摘要失败:', error)
      toast.error('提交摘要失败')
    }
  }

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answers[questionId]?.trim()) {
      toast.error('请输入回答内容')
      return
    }

    try {
      const selectedRole = localStorage.getItem('selectedRole')
      if (!selectedRole) {
        return null
      }
      const roleData = JSON.parse(selectedRole); const user = { id: emailToUUID(roleData.email), email: roleData.email }
      if (!user) {
        toast.error('请先登录')
        return
      }

      const response = await fetch('/api/reports/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          answer_text: answers[questionId],
          report_id: selectedReport?.id,
          user_id: user.id
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`回答已提交！得分: ${result.score}`)
      } else {
        toast.error('提交失败')
      }
    } catch (error) {
      console.error('提交回答失败:', error)
      toast.error('提交回答失败')
    }
  }

  const getCurrentIndex = () => {
    if (!selectedReport) return -1
    return reports.findIndex(r => r.id === selectedReport.id)
  }

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report)
    setActiveTab('reading')
    setSummaryText('')
    setAnswers({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex > 0) {
      handleSelectReport(reports[currentIndex - 1])
    }
  }

  const handleNext = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex < reports.length - 1) {
      handleSelectReport(reports[currentIndex + 1])
    }
  }

  const canGoPrevious = () => getCurrentIndex() > 0
  const canGoNext = () => getCurrentIndex() < reports.length - 1

  const getCategoryBadge = (category: string) => {
    const colors = {
      ai: 'bg-purple-100 text-purple-700',
      tech: 'bg-blue-100 text-blue-700',
      business: 'bg-green-100 text-green-700'
    }
    const labels = {
      ai: 'AI',
      tech: '科技',
      business: '商业'
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
          上一篇
        </Button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {reports.length}
        </span>
        <Button
          onClick={handleNext}
          disabled={!canGoNext()}
          className="flex items-center gap-2"
        >
          下一篇
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                行业报告阅读
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                每周精选优质行业报告，提升专业英语阅读能力
              </p>
            </div>
            <Button
              onClick={handleFetchReports}
              disabled={fetching}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 self-start sm:self-auto"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  抓取中...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  抓取最新报告
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:items-start">
          {/* 左侧：报告列表 */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
              <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  报告列表
                  <span className="text-xs text-gray-500 font-normal">({reports.length})</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all duration-200 group ${
                      selectedReport?.id === report.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg scale-[1.02]'
                        : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getCategoryBadge(report.category)}
                      {getDifficultyBadge(report.difficulty)}
                    </div>
                    <p className={`font-medium text-sm sm:text-base line-clamp-2 mb-2 ${
                      selectedReport?.id === report.id ? 'text-white' : 'text-gray-900 group-hover:text-indigo-600'
                    }`}>
                      {report.title}
                    </p>
                    <div className={`flex items-center gap-2 text-xs ${
                      selectedReport?.id === report.id ? 'text-indigo-100' : 'text-gray-500'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {report.reading_time_minutes} 分钟
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

        {/* 右侧：报告内容 */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedReport && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden h-auto lg:h-[calc(100vh-200px)] flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-4 w-full flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-0 p-2 rounded-none h-[52px]">
                <TabsTrigger value="reading" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  阅读
                </TabsTrigger>
                <TabsTrigger value="vocabulary" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  词汇
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  摘要
                </TabsTrigger>
                <TabsTrigger value="discussion" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  讨论
                </TabsTrigger>
              </TabsList>

              {/* 阅读标签页 */}
              <TabsContent value="reading" className="flex-1 overflow-y-auto m-0 p-6 sm:p-8 md:p-12 data-[state=active]:animate-in data-[state=active]:fade-in-50">
                  <div className="space-y-8">
                    {/* 头部信息 */}
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-center gap-3 mb-4">
                        {getCategoryBadge(selectedReport.category)}
                        {getDifficultyBadge(selectedReport.difficulty)}
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {selectedReport.reading_time_minutes} 分钟阅读
                        </div>
                      </div>
                      <h1 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">
                        {selectedReport.title}
                      </h1>
                      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                        <p className="text-base text-gray-700 leading-relaxed italic">
                          {selectedReport.summary}
                        </p>
                      </div>
                    </div>

                    {/* 报告正文 */}
                    <article className="prose prose-lg max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
                      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                      prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                      prose-li:text-gray-700 prose-li:mb-2
                      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                      prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-indigo-600
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                      prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-lg prose-img:shadow-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedReport.content}
                      </ReactMarkdown>
                    </article>
                  </div>
                  <NavigationButtons />
              </TabsContent>

              {/* 词汇标签页 */}
              <TabsContent value="vocabulary" className="flex-1 overflow-y-auto m-0 p-6 sm:p-8 data-[state=active]:animate-in data-[state=active]:fade-in-50">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">重点词汇讲解</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      共 {vocabulary.length} 个重点词汇 · 掌握这些词汇将帮助你更好地理解行业报告
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    {vocabulary.map((vocab, index) => (
                      <div key={vocab.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-2xl font-bold text-gray-900">{vocab.word}</h4>
                                <span className="text-base text-indigo-600">{vocab.phonetic}</span>
                                <Badge variant="outline" className="text-xs">{vocab.word_type}</Badge>
                              </div>

                              <div className="space-y-3 mt-4">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-semibold text-gray-500 min-w-[60px] mt-1">英文释义</span>
                                  <p className="text-base text-gray-700 leading-relaxed flex-1">
                                    {vocab.definition_en}
                                  </p>
                                </div>

                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-semibold text-gray-500 min-w-[60px] mt-1">中文释义</span>
                                  <p className="text-base text-gray-700 leading-relaxed flex-1">
                                    {vocab.definition_cn}
                                  </p>
                                </div>

                                {vocab.example_sentence && (
                                  <div className="mt-3 bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r">
                                    <p className="text-sm text-gray-700 italic leading-relaxed">
                                      <span className="font-semibold not-italic text-indigo-700">例句：</span>
                                      "{vocab.example_sentence}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            {getDifficultyBadge(vocab.difficulty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <NavigationButtons />
              </TabsContent>

              {/* 摘要标签页 */}
              <TabsContent value="summary" className="flex-1 overflow-y-auto m-0 p-6 sm:p-8 data-[state=active]:animate-in data-[state=active]:fade-in-50">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">撰写英文摘要</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        📝 请用英文撰写这篇报告的摘要。AI 将从准确性、完整性、简洁性、语言质量和连贯性五个维度对你的摘要进行评分（0-100分）。
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                        <span>✅ 建议字数：150-250 词</span>
                        <span>✅ 涵盖主要观点</span>
                        <span>✅ 语言简洁清晰</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        你的摘要
                      </label>
                      <textarea
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Write your summary here in English...

Example structure:
- Introduction: Brief overview of the report topic
- Key Points: 3-5 main findings or arguments
- Conclusion: Summary of implications or recommendations"
                        className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-base leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-gray-600">
                          <span className="font-semibold">字数：</span>
                          <span className={`font-bold ${
                            summaryText.split(/\s+/).filter(w => w.length > 0).length >= 150 &&
                            summaryText.split(/\s+/).filter(w => w.length > 0).length <= 250
                              ? 'text-green-600'
                              : 'text-orange-600'
                          }`}>
                            {summaryText.split(/\s+/).filter(w => w.length > 0).length}
                          </span>
                          {' '}词
                        </span>
                        {summaryText.split(/\s+/).filter(w => w.length > 0).length < 150 && (
                          <span className="text-xs text-orange-600">
                            建议再增加 {150 - summaryText.split(/\s+/).filter(w => w.length > 0).length} 词
                          </span>
                        )}
                        {summaryText.split(/\s+/).filter(w => w.length > 0).length > 250 && (
                          <span className="text-xs text-orange-600">
                            建议减少 {summaryText.split(/\s+/).filter(w => w.length > 0).length - 250} 词
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={handleSubmitSummary}
                        disabled={!summaryText.trim()}
                        size="lg"
                      >
                        提交摘要获取评分
                      </Button>
                    </div>
                  </div>

                  <NavigationButtons />
              </TabsContent>

              {/* 讨论标签页 */}
              <TabsContent value="discussion" className="flex-1 overflow-y-auto m-0 p-6 sm:p-8 data-[state=active]:animate-in data-[state=active]:fade-in-50">
                  <h3 className="text-2xl font-bold mb-6">讨论问题</h3>
                  <div className="space-y-8">
                    {questions.map((question, index) => (
                      <div key={question.id} className="space-y-4 pb-8 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start gap-4">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex-shrink-0 text-lg">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-4">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {question.question_type === 'opinion' ? '观点题' :
                                 question.question_type === 'analysis' ? '分析题' : '开放题'}
                              </Badge>
                              <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                                {question.question}
                              </p>
                            </div>

                            {/* 参考答案展示区域 */}
                            {showSampleAnswer === question.id && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-semibold text-amber-800">📝 参考答案</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto h-6 text-xs"
                                    onClick={() => setShowSampleAnswer(null)}
                                  >
                                    隐藏
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                  {question.sample_answer}
                                </p>
                              </div>
                            )}

                            {/* 答题区域 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                你的回答
                              </label>
                              <textarea
                                value={answers[question.id] || ''}
                                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                                placeholder="Type your answer in English..."
                                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-base"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                字数: {(answers[question.id] || '').split(/\s+/).filter(w => w.length > 0).length}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowSampleAnswer(showSampleAnswer === question.id ? null : question.id)
                                }}
                              >
                                {showSampleAnswer === question.id ? '隐藏参考答案' : '查看参考答案'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSubmitAnswer(question.id)}
                                disabled={!(answers[question.id]?.trim())}
                              >
                                提交回答
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <NavigationButtons />
              </TabsContent>
            </Tabs>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
