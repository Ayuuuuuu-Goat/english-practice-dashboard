// 每日词卡发音练习 - TypeScript类型定义

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type Language = 'en' | 'zh'
export type PreferredDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

// 词卡
export interface WordCard {
  id: string
  word: string
  phonetic?: string
  translation?: string
  example_sentence?: string
  difficulty: DifficultyLevel
  category: string
  language: Language
  is_preset: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// 发音练习记录
export interface PronunciationAttempt {
  id: string
  user_id: string
  word_card_id: string
  audio_url?: string
  total_score?: number
  accuracy_score?: number
  fluency_score?: number
  integrity_score?: number
  phone_score?: number
  tone_score?: number
  raw_result?: IFlyTekResult
  practice_date: string
  created_at: string
}

// 用户设置
export interface UserPronunciationSettings {
  user_id: string
  daily_word_count: number
  preferred_categories?: string[]
  preferred_difficulty: PreferredDifficulty
  auto_advance: boolean
  show_phonetic: boolean
  created_at: string
  updated_at: string
}

// 每日统计
export interface DailyPracticeStats {
  id: string
  user_id: string
  practice_date: string
  target_count: number
  completed_count: number
  avg_total_score?: number
  total_duration_seconds?: number
  created_at: string
}

// 科大讯飞评测结果
export interface IFlyTekResult {
  read_chapter?: {
    rec_paper: {
      read_chapter: {
        beg_pos: number
        end_pos: number
        content: string
        total_score: number
        is_rejected: boolean
        except_info: string
        sentences?: IFlyTekSentence[]
      }
    }
  }
}

export interface IFlyTekSentence {
  beg_pos: number
  end_pos: number
  content: string
  total_score: number
  words?: IFlyTekWord[]
}

export interface IFlyTekWord {
  beg_pos: number
  end_pos: number
  content: string
  dp_message: number
  global_index: number
  index: number
  time_len: number
  total_score: number
  syllables?: IFlyTekSyllable[]
}

export interface IFlyTekSyllable {
  beg_pos: number
  end_pos: number
  content: string
  symbol: string
  dp_message: number
  time_len: number
  phones?: IFlyTekPhone[]
}

export interface IFlyTekPhone {
  beg_pos: number
  end_pos: number
  content: string
  dp_message: number
  time_len: number
  perr_level_msg: string
  syll_accent: string
  symbol: string
}

// 录音状态
export type RecordingStatus = 'idle' | 'requesting-permission' | 'recording' | 'processing' | 'uploading' | 'evaluating' | 'completed' | 'error'

// 练习会话状态
export interface PracticeSession {
  words: WordCard[]
  currentIndex: number
  completedAttempts: PronunciationAttempt[]
  startTime: Date
  endTime?: Date
}

// API请求/响应类型
export interface EvaluatePronunciationRequest {
  audio_url: string
  text: string
  language: Language
  category: 'read_syllable' | 'read_word' | 'read_sentence' | 'read_chapter'
  user_id: string
  word_card_id: string
}

export interface EvaluatePronunciationResponse {
  success: boolean
  attempt_id?: string
  scores?: {
    total_score: number
    accuracy_score: number
    fluency_score: number
    integrity_score: number
    phone_score?: number
    tone_score?: number
  }
  raw_result?: IFlyTekResult
  error?: string
}

// 统计数据
export interface PronunciationStats {
  total_attempts: number
  avg_score: number
  best_score: number
  worst_score: number
  current_streak: number
  longest_streak: number
  by_difficulty: {
    easy: { count: number; avg_score: number }
    medium: { count: number; avg_score: number }
    hard: { count: number; avg_score: number }
  }
  recent_attempts: PronunciationAttempt[]
  progress_by_date: Array<{
    date: string
    count: number
    avg_score: number
  }>
}

// 词卡筛选选项
export interface WordSelectionOptions {
  user_id: string
  count: number
  difficulty?: PreferredDifficulty
  categories?: string[]
  language?: Language
  exclude_ids?: string[]
}
