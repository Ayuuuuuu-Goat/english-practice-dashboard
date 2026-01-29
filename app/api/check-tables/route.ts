import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 检查各个表是否存在
    const tables = [
      'industry_reports',
      'report_vocabulary',
      'report_discussion_questions',
      'tech_podcasts',
      'podcast_segments',
      'podcast_vocabulary'
    ]

    const results: any = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1)

        results[table] = {
          exists: !error,
          error: error?.message
        }
      } catch (e: any) {
        results[table] = {
          exists: false,
          error: e.message
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
