// ============================================
// 合并版 Edge Function - 可直接在 Supabase Dashboard 中使用
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// 签名生成函数
// ============================================

async function generateSignature(params: {
  apiKey: string
  apiSecret: string
  host: string
  date: string
  requestLine: string
}): Promise<string> {
  const { apiKey, apiSecret, host, date, requestLine } = params

  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const messageData = encoder.encode(signatureOrigin)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return signatureBase64
}

async function generateAuthUrl(params: {
  appId: string
  apiKey: string
  apiSecret: string
  baseUrl: string
  requestLine: string
}): Promise<string> {
  const { appId, apiKey, apiSecret, baseUrl, requestLine } = params

  const date = new Date().toUTCString()
  const url = new URL(baseUrl)
  const host = url.host

  const signature = await generateSignature({
    apiKey,
    apiSecret,
    host,
    date,
    requestLine,
  })

  const authorization = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorizationBase64 = btoa(authorization)

  url.searchParams.set('authorization', authorizationBase64)
  url.searchParams.set('date', date)
  url.searchParams.set('host', host)

  return url.toString()
}

// ============================================
// iFlytek 客户端
// ============================================

interface IFlyTekConfig {
  appId: string
  apiKey: string
  apiSecret: string
}

interface EvaluateParams {
  audioData: ArrayBuffer
  text: string
  language: 'en' | 'zh'
  category: 'read_syllable' | 'read_word' | 'read_sentence' | 'read_chapter'
}

class IFlyTekClient {
  private config: IFlyTekConfig

  constructor(config: IFlyTekConfig) {
    this.config = config
  }

  async evaluate(params: EvaluateParams): Promise<any> {
    const { audioData, text, language, category } = params

    const businessParams = {
      category: category,
      sub: category === 'read_word' ? 'edu.word.score' : 'edu.eval',
      ent: language === 'en' ? 'en_vip' : 'cn_vip',
      cmd: 'ssb',
      aus: 1,
      aue: 'raw',
      auf: 'audio/L16;rate=16000',
      ttp_skip: true,
      grade: 'adult',
    }

    const requestParams = {
      common: {
        app_id: this.config.appId,
      },
      business: businessParams,
      data: {
        status: 2,
        encoding: 'raw',
        text: btoa(unescape(encodeURIComponent(text))),
      },
    }

    try {
      const baseUrl = 'wss://ise-api.xfyun.cn/v2/open-ise'
      const requestLine = 'GET /v2/open-ise HTTP/1.1'

      const authUrl = await generateAuthUrl({
        appId: this.config.appId,
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        baseUrl,
        requestLine,
      })

      const result = await this.sendWebSocketRequest(authUrl, requestParams, audioData)
      return result
    } catch (error) {
      console.error('iFlyTek evaluation error:', error)
      throw error
    }
  }

  private async sendWebSocketRequest(
    url: string,
    params: any,
    audioData: ArrayBuffer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      let result = ''

      ws.onopen = () => {
        console.log('WebSocket connected')

        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioData)))

        const frame = {
          ...params,
          data: {
            ...params.data,
            audio: audioBase64,
          },
        }

        ws.send(JSON.stringify(frame))
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)

          if (response.code !== 0) {
            reject(new Error(`iFlyTek API Error: ${response.message}`))
            ws.close()
            return
          }

          if (response.data) {
            result += response.data.data
          }

          if (response.data && response.data.status === 2) {
            ws.close()
          }
        } catch (error) {
          reject(error)
          ws.close()
        }
      }

      ws.onclose = () => {
        console.log('WebSocket closed')

        if (result) {
          try {
            const decodedResult = atob(result)
            const parsedResult = JSON.parse(decodedResult)
            resolve(parsedResult)
          } catch (error) {
            reject(new Error('Failed to parse result'))
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close()
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }
}

// ============================================
// 主处理函数
// ============================================

interface RequestBody {
  audio_url: string
  text: string
  language: 'en' | 'zh'
  category: 'read_syllable' | 'read_word' | 'read_sentence' | 'read_chapter'
  user_id: string
  word_card_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { audio_url, text, language, category, user_id, word_card_id } = body

    if (!audio_url || !text || !language || !category || !user_id || !word_card_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    console.log('Downloading audio from:', audio_url)
    const audioResponse = await fetch(audio_url)

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file')
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer()
    console.log('Audio downloaded, size:', audioArrayBuffer.byteLength)

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

    const scores = extractScores(result, language)

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

    await updateDailyStats(supabase, user_id, scores.total_score)

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

function extractScores(result: any, language: 'en' | 'zh') {
  const scores = {
    total_score: 0,
    accuracy_score: 0,
    fluency_score: 0,
    integrity_score: 0,
    phone_score: 0,
    tone_score: 0,
  }

  try {
    if (result.read_chapter) {
      const chapter = result.read_chapter.rec_paper.read_chapter

      scores.total_score = parseFloat(chapter.total_score || 0)

      if (language === 'en' && chapter.sentences && chapter.sentences.length > 0) {
        const sentence = chapter.sentences[0]

        if (sentence.words && sentence.words.length > 0) {
          const word = sentence.words[0]

          if (word.syllables && word.syllables.length > 0) {
            let totalPhoneScore = 0
            let phoneCount = 0

            word.syllables.forEach((syll: any) => {
              if (syll.phones) {
                syll.phones.forEach((phone: any) => {
                  totalPhoneScore += parseFloat(phone.dp_message || 0)
                  phoneCount++
                })
              }
            })

            scores.accuracy_score = phoneCount > 0 ? totalPhoneScore / phoneCount : 0
          }

          scores.fluency_score = scores.total_score * 0.9
          scores.integrity_score = scores.total_score * 1.1
        }
      }

      if (language === 'zh') {
        scores.phone_score = scores.total_score
        scores.tone_score = scores.total_score
      }
    }
  } catch (error) {
    console.error('Error extracting scores:', error)
  }

  Object.keys(scores).forEach((key) => {
    scores[key as keyof typeof scores] = Math.max(0, Math.min(100, scores[key as keyof typeof scores]))
  })

  return scores
}

async function updateDailyStats(supabase: any, userId: string, score: number) {
  const today = new Date().toISOString().split('T')[0]

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
    await supabase.from('daily_practice_stats').insert({
      user_id: userId,
      practice_date: today,
      target_count: 10,
      completed_count: 1,
      avg_total_score: score,
    })
  }
}
