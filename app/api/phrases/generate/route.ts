import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting business phrases generation...')

    // 检查现有短语数量
    const { count } = await supabase
      .from('business_phrases')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current phrases count: ${count}`)

    // 如果已有50个以上短语，跳过生成
    if (count && count >= 50) {
      return NextResponse.json({
        success: true,
        message: 'Already have enough phrases',
        count
      })
    }

    // 使用AI生成新的商务短语
    const prompt = `Generate 10 authentic and commonly used business English phrases for professional workplace communication.

For each phrase, provide:
1. The English phrase (natural and idiomatic)
2. Chinese translation
3. Category (meeting/email/negotiation/social)
4. Example sentence showing real-world usage
5. Chinese translation of the example
6. Brief usage notes (when/why to use it)
7. Difficulty level (easy/medium/hard)

Focus on:
- Modern, current business language
- Phrases that native speakers actually use
- Practical workplace scenarios
- Varied difficulty levels
- Different categories

Return in JSON format:
{
  "phrases": [
    {
      "phrase_en": "string",
      "phrase_cn": "string",
      "category": "meeting|email|negotiation|social",
      "example_sentence": "string",
      "example_translation": "string",
      "usage_notes": "string",
      "difficulty": "easy|medium|hard"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"phrases":[]}')
    const newPhrases = result.phrases || []

    console.log(`✨ Generated ${newPhrases.length} new phrases`)

    // 获取当前最大的order_index
    const { data: maxOrderData } = await supabase
      .from('business_phrases')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    let currentOrderIndex = maxOrderData?.order_index || 0

    // 插入新短语
    const inserted = []
    for (const phrase of newPhrases) {
      currentOrderIndex++

      // 检查是否已存在相同短语
      const { data: existing } = await supabase
        .from('business_phrases')
        .select('id')
        .eq('phrase_en', phrase.phrase_en)
        .single()

      if (existing) {
        console.log(`⏭️  Skipping existing phrase: ${phrase.phrase_en}`)
        continue
      }

      const { data, error } = await supabase
        .from('business_phrases')
        .insert({
          phrase_en: phrase.phrase_en,
          phrase_cn: phrase.phrase_cn,
          category: phrase.category,
          example_sentence: phrase.example_sentence,
          example_translation: phrase.example_translation,
          usage_notes: phrase.usage_notes,
          difficulty: phrase.difficulty,
          order_index: currentOrderIndex,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting phrase:', error)
        continue
      }

      inserted.push(data)
      console.log(`✅ Inserted: ${phrase.phrase_en}`)
    }

    return NextResponse.json({
      success: true,
      generated: newPhrases.length,
      inserted: inserted.length,
      phrases: inserted
    })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
