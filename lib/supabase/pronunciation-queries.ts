// Supabase查询函数 - 发音练习功能

import { createClient } from '@/lib/supabase'
import type {
  WordCard,
  PronunciationAttempt,
  UserPronunciationSettings,
  DailyPracticeStats,
  WordSelectionOptions,
  PronunciationStats,
} from '@/lib/pronunciation/types'

const supabase = createClient()

// ============================================
// 词卡查询
// ============================================

/**
 * 获取所有可用词卡（预设 + 用户自建）
 */
export async function getAvailableWordCards(userId: string) {
  const { data, error } = await supabase
    .from('word_cards')
    .select('*')
    .or(`is_preset.eq.true,created_by.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as WordCard[]
}

/**
 * 根据ID获取词卡
 */
export async function getWordCardById(id: string) {
  const { data, error } = await supabase
    .from('word_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as WordCard
}

/**
 * 创建自定义词卡
 */
export async function createWordCard(wordCard: Partial<WordCard>) {
  const { data, error } = await supabase
    .from('word_cards')
    .insert({
      word: wordCard.word,
      phonetic: wordCard.phonetic,
      translation: wordCard.translation,
      example_sentence: wordCard.example_sentence,
      difficulty: wordCard.difficulty,
      category: wordCard.category,
      language: wordCard.language,
      is_preset: false,
      created_by: wordCard.created_by,
    })
    .select()
    .single()

  if (error) throw error
  return data as WordCard
}

/**
 * 更新词卡
 */
export async function updateWordCard(id: string, updates: Partial<WordCard>) {
  const { data, error } = await supabase
    .from('word_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WordCard
}

/**
 * 删除词卡
 */
export async function deleteWordCard(id: string) {
  const { error } = await supabase
    .from('word_cards')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// 发音练习记录
// ============================================

/**
 * 创建发音练习记录
 */
export async function createPronunciationAttempt(attempt: Partial<PronunciationAttempt>) {
  const { data, error } = await supabase
    .from('pronunciation_attempts')
    .insert({
      user_id: attempt.user_id,
      word_card_id: attempt.word_card_id,
      audio_url: attempt.audio_url,
      total_score: attempt.total_score,
      accuracy_score: attempt.accuracy_score,
      fluency_score: attempt.fluency_score,
      integrity_score: attempt.integrity_score,
      phone_score: attempt.phone_score,
      tone_score: attempt.tone_score,
      raw_result: attempt.raw_result,
      practice_date: attempt.practice_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data as PronunciationAttempt
}

/**
 * 获取用户的练习记录
 */
export async function getPronunciationAttempts(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    word_card_id?: string
    start_date?: string
    end_date?: string
  }
) {
  let query = supabase
    .from('pronunciation_attempts')
    .select('*, word_cards(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.word_card_id) {
    query = query.eq('word_card_id', options.word_card_id)
  }

  if (options?.start_date) {
    query = query.gte('practice_date', options.start_date)
  }

  if (options?.end_date) {
    query = query.lte('practice_date', options.end_date)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as PronunciationAttempt[]
}

/**
 * 获取特定词卡的练习历史
 */
export async function getWordCardHistory(userId: string, wordCardId: string) {
  const { data, error } = await supabase
    .from('pronunciation_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('word_card_id', wordCardId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PronunciationAttempt[]
}

// ============================================
// 用户设置
// ============================================

/**
 * 获取用户设置
 */
export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_pronunciation_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // 如果不存在，创建默认设置
    if (error.code === 'PGRST116') {
      return createDefaultUserSettings(userId)
    }
    throw error
  }

  return data as UserPronunciationSettings
}

/**
 * 创建默认用户设置
 */
async function createDefaultUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_pronunciation_settings')
    .insert({
      user_id: userId,
      daily_word_count: 10,
      preferred_difficulty: 'mixed',
      auto_advance: true,
      show_phonetic: true,
    })
    .select()
    .single()

  if (error) throw error
  return data as UserPronunciationSettings
}

/**
 * 更新用户设置
 */
export async function updateUserSettings(userId: string, settings: Partial<UserPronunciationSettings>) {
  const { data, error } = await supabase
    .from('user_pronunciation_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserPronunciationSettings
}

// ============================================
// 每日统计
// ============================================

/**
 * 获取或创建当日统计
 */
export async function getTodayStats(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_practice_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('practice_date', today)
    .single()

  if (error) {
    // 如果不存在，创建新的
    if (error.code === 'PGRST116') {
      const settings = await getUserSettings(userId)
      return createDailyStats(userId, settings.daily_word_count)
    }
    throw error
  }

  return data as DailyPracticeStats
}

/**
 * 创建每日统计
 */
async function createDailyStats(userId: string, targetCount: number) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_practice_stats')
    .insert({
      user_id: userId,
      practice_date: today,
      target_count: targetCount,
      completed_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as DailyPracticeStats
}

/**
 * 更新每日统计
 */
export async function updateDailyStats(
  userId: string,
  date: string,
  updates: Partial<DailyPracticeStats>
) {
  const { data, error } = await supabase
    .from('daily_practice_stats')
    .update(updates)
    .eq('user_id', userId)
    .eq('practice_date', date)
    .select()
    .single()

  if (error) throw error
  return data as DailyPracticeStats
}

/**
 * 增加完成数量并更新平均分
 */
export async function incrementCompletedCount(userId: string, score: number) {
  const stats = await getTodayStats(userId)
  const newCompletedCount = stats.completed_count + 1

  // 计算新的平均分
  const currentTotal = (stats.avg_total_score || 0) * stats.completed_count
  const newAvgScore = (currentTotal + score) / newCompletedCount

  return updateDailyStats(userId, stats.practice_date, {
    completed_count: newCompletedCount,
    avg_total_score: parseFloat(newAvgScore.toFixed(2)),
  })
}

/**
 * 获取历史统计数据
 */
export async function getHistoricalStats(userId: string, days: number = 30) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('daily_practice_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('practice_date', startDate.toISOString().split('T')[0])
    .lte('practice_date', endDate.toISOString().split('T')[0])
    .order('practice_date', { ascending: true })

  if (error) throw error
  return data as DailyPracticeStats[]
}

// ============================================
// 统计和分析
// ============================================

/**
 * 获取完整的练习统计
 */
export async function getPronunciationStats(userId: string): Promise<PronunciationStats> {
  // 获取所有练习记录
  const attempts = await getPronunciationAttempts(userId, { limit: 1000 })

  // 基础统计
  const total_attempts = attempts.length
  const scores = attempts.map(a => a.total_score || 0)
  const avg_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const best_score = scores.length > 0 ? Math.max(...scores) : 0
  const worst_score = scores.length > 0 ? Math.min(...scores) : 0

  // 按难度分组
  const byDifficulty = {
    easy: { count: 0, avg_score: 0 },
    medium: { count: 0, avg_score: 0 },
    hard: { count: 0, avg_score: 0 },
  }

  // 计算连续天数
  const dates = Array.from(new Set(attempts.map(a => a.practice_date))).sort().reverse()
  let current_streak = 0
  let longest_streak = 0
  let temp_streak = 0

  const today = new Date().toISOString().split('T')[0]
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i])
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]

    if (dates[i] === expectedStr) {
      temp_streak++
      if (i === 0 || dates[i] === today) {
        current_streak = temp_streak
      }
    } else {
      temp_streak = 0
    }

    longest_streak = Math.max(longest_streak, temp_streak)
  }

  // 最近30天的进度
  const progress_by_date = await getHistoricalStats(userId, 30)

  return {
    total_attempts,
    avg_score: parseFloat(avg_score.toFixed(2)),
    best_score,
    worst_score,
    current_streak,
    longest_streak,
    by_difficulty: byDifficulty,
    recent_attempts: attempts.slice(0, 10),
    progress_by_date: progress_by_date.map(stat => ({
      date: stat.practice_date,
      count: stat.completed_count,
      avg_score: stat.avg_total_score || 0,
    })),
  }
}
