// Supabase Edge Function: 发音评测

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { IFlyTekClient } from './iflytek-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  audio_url: string
  text: string
  language: 'en' | 'zh'
  category: 'read_syllable' | 'read_word' | 'read_sentence' | 'read_chapter'
  user_id: string
  word_card_id: string
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 解析请求体
    const body: RequestBody = await req.json()
    const { audio_url, text, language, category, user_id, word_card_id } = body

    // 验证必需参数
    if (!audio_url || !text || !language || !category || !user_id || !word_card_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 获取环境变量
    const IFLYTEK_APPID = Deno.env.get('IFLYTEK_APPID')
    const IFLYTEK_API_KEY = Deno.env.get('IFLYTEK_API_KEY')
    const IFLYTEK_API_SECRET = Deno.env.get('IFLYTEK_API_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPA_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPA_SERVICE_ROLE_KEY')

    if (!IFLYTEK_APPID || !IFLYTEK_API_KEY || !IFLYTEK_API_SECRET) {
      throw new Error('iFlyTek credentials not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured')
    }

    // 1. 从 Vercel Blob 下载音频文件
    console.log('Downloading audio from:', audio_url)
    const audioResponse = await fetch(audio_url)

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file')
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer()
    console.log('Audio downloaded, size:', audioArrayBuffer.byteLength)

    // 2. 调用科大讯飞API进行评测
    console.log('Calling iFlyTek API...')
    const client = new IFlyTekClient({
      appId: IFLYTEK_APPID,
      apiKey: IFLYTEK_API_KEY,
      apiSecret: IFLYTEK_API_SECRET,
    })

    const result = await client.evaluate({
      audioData: audioArrayBuffer,
      text,
      language,
      category,
    })

    console.log('iFlyTek result:', JSON.stringify(result))

    // 3. 解析评分结果
    const scores = extractScores(result, language, category)

    // 4. 保存到数据库
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: attempt, error: dbError } = await supabase
      .from('pronunciation_attempts')
      .insert({
        user_id,
        word_card_id,
        audio_url,
        total_score: scores.total_score,
        accuracy_score: scores.accuracy_score,
        fluency_score: scores.fluency_score,
        integrity_score: scores.integrity_score,
        phone_score: scores.phone_score,
        tone_score: scores.tone_score,
        raw_result: result,
        practice_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save attempt to database')
    }

    // 5. 更新每日统计
    await updateDailyStats(supabase, user_id, scores.total_score)

    // 6. 返回结果
    return new Response(
      JSON.stringify({
        success: true,
        attempt_id: attempt.id,
        scores,
        raw_result: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * 从科大讯飞结果中提取评分
 */
function extractScores(result: any, language: 'en' | 'zh', category: string = 'read_word') {
  const scores = {
    total_score: 0,
    accuracy_score: 0,
    fluency_score: 0,
    integrity_score: 0,
    phone_score: 0,
    tone_score: 0,
  }

  try {
    console.log('Extracting scores for category:', category)

    let dataNode = null

    // 根据评测类型获取不同的节点
    if (category === 'read_chapter' && result.read_chapter) {
      dataNode = result.read_chapter.rec_paper?.read_chapter
    } else if (category === 'read_sentence' && result.read_sentence) {
      dataNode = result.read_sentence.rec_paper?.read_sentence
    } else if (category === 'read_word' && result.read_word) {
      dataNode = result.read_word.rec_paper?.read_word
    }

    if (!dataNode) {
      console.error('No evaluation data node found for category:', category)
      return scores
    }

    // 提取基础分数
    const rawTotalScore = parseFloat(dataNode.total_score || 0)
    const rawAccuracyScore = parseFloat(dataNode.accuracy_score || 0)
    const rawFluencyScore = parseFloat(dataNode.fluency_score || 0)
    const rawIntegrityScore = parseFloat(dataNode.integrity_score || 0)

    console.log('Raw scores:', {
      rawTotalScore,
      rawAccuracyScore,
      rawFluencyScore,
      rawIntegrityScore
    })

    // 自动判断分数范围
    const isScaleOf10 = rawTotalScore <= 10 && rawTotalScore > 0
    const scoreMultiplier = isScaleOf10 ? 10 : 1

    scores.total_score = rawTotalScore * scoreMultiplier
    scores.accuracy_score = rawAccuracyScore * scoreMultiplier

    // 使用返回的流利度和完整度分数（如果有）
    if (rawFluencyScore > 0) {
      scores.fluency_score = rawFluencyScore * scoreMultiplier
    } else {
      scores.fluency_score = scores.total_score * 0.95
    }

    if (rawIntegrityScore > 0) {
      scores.integrity_score = rawIntegrityScore * scoreMultiplier
    } else {
      scores.integrity_score = scores.total_score
    }

    scores.phone_score = scores.accuracy_score

    // 中文评分
    if (language === 'zh') {
      scores.tone_score = scores.total_score * 0.9
    }
  } catch (error) {
    console.error('Error extracting scores:', error)
  }

  // 确保所有分数在0-100之间
  Object.keys(scores).forEach((key) => {
    scores[key as keyof typeof scores] = Math.max(0, Math.min(100, scores[key as keyof typeof scores]))
  })

  console.log('Final scores:', scores)
  return scores
}

/**
 * 更新每日统计
 */
async function updateDailyStats(supabase: any, userId: string, score: number) {
  const today = new Date().toISOString().split('T')[0]

  // 获取今日统计
  const { data: stats, error: fetchError } = await supabase
    .from('daily_practice_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('practice_date', today)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching daily stats:', fetchError)
    return
  }

  if (stats) {
    // 更新现有记录
    const newCompletedCount = stats.completed_count + 1
    const currentTotal = (stats.avg_total_score || 0) * stats.completed_count
    const newAvgScore = (currentTotal + score) / newCompletedCount

    await supabase
      .from('daily_practice_stats')
      .update({
        completed_count: newCompletedCount,
        avg_total_score: parseFloat(newAvgScore.toFixed(2)),
      })
      .eq('user_id', userId)
      .eq('practice_date', today)
  } else {
    // 创建新记录
    await supabase.from('daily_practice_stats').insert({
      user_id: userId,
      practice_date: today,
      target_count: 10, // 默认目标
      completed_count: 1,
      avg_total_score: score,
    })
  }
}
