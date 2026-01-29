import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 检查报告
    const { data: reports, error: reportsError } = await supabase
      .from('industry_reports')
      .select('id, title, category, created_at, published_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (reportsError) {
      return NextResponse.json({
        success: false,
        error: reportsError.message,
        reports: []
      })
    }

    // 检查播客表是否存在
    const { data: podcasts, error: podcastsError } = await supabase
      .from('tech_podcasts')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      reports: reports || [],
      reportCount: reports?.length || 0,
      podcasts: podcasts || [],
      podcastCount: podcasts?.length || 0,
      podcastError: podcastsError?.message
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
