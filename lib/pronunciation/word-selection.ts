// 词卡选择算法

import type { WordCard, WordSelectionOptions, PreferredDifficulty } from './types'
import { createClient } from '@/lib/supabase'
import { getPronunciationAttempts } from '@/lib/supabase/pronunciation-queries'

/**
 * 智能选择每日练习词卡
 *
 * 选择策略：
 * 1. 从未练习过的词（优先级最高）
 * 2. 最近分数低于70分的词（需要复习）
 * 3. 7天以上未练习的词（遗忘曲线）
 * 4. 随机选择剩余词卡
 */
export async function selectDailyWords(options: WordSelectionOptions): Promise<WordCard[]> {
  const { user_id, count, difficulty, categories, language, exclude_ids = [] } = options

  const supabase = createClient()

  // 1. 获取所有符合条件的词卡
  let query = supabase
    .from('word_cards')
    .select('*')
    .or('is_preset.eq.true,created_by.eq.' + user_id)

  // 应用语言过滤
  if (language) {
    query = query.eq('language', language)
  }

  // 应用难度过滤
  if (difficulty && difficulty !== 'mixed') {
    query = query.eq('difficulty', difficulty)
  }

  // 应用分类过滤
  if (categories && categories.length > 0) {
    query = query.in('category', categories)
  }

  // 排除指定的ID
  if (exclude_ids.length > 0) {
    query = query.not('id', 'in', `(${exclude_ids.join(',')})`)
  }

  const { data: allWords, error } = await query

  if (error) {
    console.error('Error fetching words:', error)
    throw error
  }

  if (!allWords || allWords.length === 0) {
    return []
  }

  // 2. 获取用户的练习历史
  const attempts = await getPronunciationAttempts(user_id, { limit: 1000 })

  // 3. 分析每个词卡的练习情况
  interface WordWithScore extends WordCard {
    priority: number
    lastPracticeDate?: string
    lastScore?: number
    practiceCount: number
  }

  const wordsWithScores: WordWithScore[] = allWords.map((word) => {
    const wordAttempts = attempts.filter((a) => a.word_card_id === word.id)
    const practiceCount = wordAttempts.length

    if (practiceCount === 0) {
      // 从未练习过：最高优先级
      return {
        ...word,
        priority: 1000,
        practiceCount: 0,
      }
    }

    // 最近一次练习的信息
    const lastAttempt = wordAttempts[0]
    const lastScore = lastAttempt.total_score || 0
    const lastPracticeDate = lastAttempt.practice_date

    // 计算距离上次练习的天数
    const daysSinceLastPractice = Math.floor(
      (new Date().getTime() - new Date(lastPracticeDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    // 计算优先级得分
    let priority = 0

    // 分数低于70分：需要复习（优先级800-900）
    if (lastScore < 70) {
      priority = 800 + (70 - lastScore) // 分数越低，优先级越高
    }
    // 7天以上未练习：遗忘曲线（优先级500-700）
    else if (daysSinceLastPractice >= 7) {
      priority = 500 + Math.min(daysSinceLastPractice * 10, 200) // 天数越多，优先级越高
    }
    // 最近练习过且分数不错：较低优先级（优先级100-400）
    else {
      priority = 400 - daysSinceLastPractice * 50 // 越近的练习，优先级越低
    }

    return {
      ...word,
      priority,
      lastPracticeDate,
      lastScore,
      practiceCount,
    }
  })

  // 4. 根据优先级排序
  wordsWithScores.sort((a, b) => {
    // 优先级高的在前
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }

    // 优先级相同时，练习次数少的在前
    if (a.practiceCount !== b.practiceCount) {
      return a.practiceCount - b.practiceCount
    }

    // 都相同时，随机排序
    return Math.random() - 0.5
  })

  // 5. 如果是混合难度，确保难度分布合理
  let selectedWords: WordCard[] = []

  if (difficulty === 'mixed') {
    const easyWords = wordsWithScores.filter((w) => w.difficulty === 'easy')
    const mediumWords = wordsWithScores.filter((w) => w.difficulty === 'medium')
    const hardWords = wordsWithScores.filter((w) => w.difficulty === 'hard')

    // 按照 5:3:2 的比例分配难度
    const easyCount = Math.ceil(count * 0.5)
    const mediumCount = Math.ceil(count * 0.3)
    const hardCount = count - easyCount - mediumCount

    selectedWords = [
      ...easyWords.slice(0, easyCount),
      ...mediumWords.slice(0, mediumCount),
      ...hardWords.slice(0, hardCount),
    ]

    // 如果某个难度不够，从其他难度补充
    while (selectedWords.length < count && wordsWithScores.length > selectedWords.length) {
      const remaining = wordsWithScores.filter(
        (w) => !selectedWords.find((s) => s.id === w.id)
      )
      if (remaining.length === 0) break
      selectedWords.push(remaining[0])
    }
  } else {
    // 单一难度，直接取前N个
    selectedWords = wordsWithScores.slice(0, count)
  }

  // 6. 打乱顺序（保持一定随机性）
  selectedWords = shuffleArray(selectedWords)

  // 移除临时属性，返回纯WordCard类型
  return selectedWords.map((word) => {
    const { priority, lastPracticeDate, lastScore, practiceCount, ...cleanWord } = word as WordWithScore
    return cleanWord as WordCard
  })
}

/**
 * 获取推荐的复习词卡（分数低或很久未练习）
 */
export async function getReviewWords(
  userId: string,
  count: number = 10
): Promise<WordCard[]> {
  const supabase = createClient()

  // 获取用户的练习历史
  const attempts = await getPronunciationAttempts(userId, { limit: 1000 })

  // 找出分数低于70的词卡
  const lowScoreAttempts = attempts.filter((a) => (a.total_score || 0) < 70)

  // 获取这些词卡的详情
  if (lowScoreAttempts.length === 0) {
    return []
  }

  const wordIds = Array.from(new Set(lowScoreAttempts.map((a) => a.word_card_id)))

  const { data: words, error } = await supabase
    .from('word_cards')
    .select('*')
    .in('id', wordIds)
    .limit(count)

  if (error) {
    console.error('Error fetching review words:', error)
    throw error
  }

  return words || []
}

/**
 * 获取从未练习过的新词
 */
export async function getNewWords(
  userId: string,
  count: number = 10,
  language?: 'en' | 'zh'
): Promise<WordCard[]> {
  const supabase = createClient()

  // 获取用户已经练习过的词卡ID
  const attempts = await getPronunciationAttempts(userId, { limit: 1000 })
  const practicedWordIds = Array.from(new Set(attempts.map((a) => a.word_card_id)))

  // 查询从未练习过的词卡
  let query = supabase
    .from('word_cards')
    .select('*')
    .or('is_preset.eq.true,created_by.eq.' + userId)

  if (language) {
    query = query.eq('language', language)
  }

  if (practicedWordIds.length > 0) {
    query = query.not('id', 'in', `(${practicedWordIds.join(',')})`)
  }

  const { data: words, error } = await query.limit(count)

  if (error) {
    console.error('Error fetching new words:', error)
    throw error
  }

  return words || []
}

/**
 * 洗牌算法 (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 获取词卡的推荐类别
 */
export async function getAvailableCategories(userId: string, language?: 'en' | 'zh'): Promise<string[]> {
  const supabase = createClient()

  let query = supabase
    .from('word_cards')
    .select('category')
    .or('is_preset.eq.true,created_by.eq.' + userId)

  if (language) {
    query = query.eq('language', language)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // 去重并排序
  const categories = Array.from(new Set(data?.map((d) => d.category).filter(Boolean)))
  return categories.sort()
}
