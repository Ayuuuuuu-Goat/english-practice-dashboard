import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * 清理重复的播客
 * 保留每个标题的最新一条记录
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    console.log('🧹 开始清理重复播客...')

    // 1. 查找所有播客
    const { data: allPodcasts, error: fetchError } = await supabase
      .from('tech_podcasts')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    if (!allPodcasts || allPodcasts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到播客',
        deleted: 0
      })
    }

    console.log(`📊 总共有 ${allPodcasts.length} 个播客`)

    // 2. 按标题分组，找出重复的
    const titleMap = new Map<string, any[]>()

    for (const podcast of allPodcasts) {
      const title = podcast.title.trim().toLowerCase()
      if (!titleMap.has(title)) {
        titleMap.set(title, [])
      }
      titleMap.get(title)!.push(podcast)
    }

    // 3. 找出重复的记录并删除
    const toDelete: string[] = []
    const kept: string[] = []

    for (const [title, podcasts] of titleMap.entries()) {
      if (podcasts.length > 1) {
        console.log(`\n📋 发现重复: "${podcasts[0].title}" (${podcasts.length} 个)`)

        // 保留最新的一个（created_at最大的）
        const sorted = podcasts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        kept.push(sorted[0].id)
        console.log(`   ✅ 保留: ${sorted[0].id} (${sorted[0].created_at})`)

        // 删除其他的
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i].id)
          console.log(`   🗑️  删除: ${sorted[i].id} (${sorted[i].created_at})`)
        }
      }
    }

    console.log(`\n📊 统计:`)
    console.log(`   总播客数: ${allPodcasts.length}`)
    console.log(`   唯一标题: ${titleMap.size}`)
    console.log(`   需要删除: ${toDelete.length}`)

    // 4. 执行删除
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('tech_podcasts')
        .delete()
        .in('id', toDelete)

      if (deleteError) throw deleteError

      console.log(`✅ 已删除 ${toDelete.length} 个重复播客`)
    }

    return NextResponse.json({
      success: true,
      message: `清理完成`,
      total: allPodcasts.length,
      unique: titleMap.size,
      deleted: toDelete.length,
      remaining: allPodcasts.length - toDelete.length
    })

  } catch (error: any) {
    console.error('清理失败:', error)
    return NextResponse.json({
      error: '清理失败',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * 查看重复情况（不删除）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: allPodcasts, error } = await supabase
      .from('tech_podcasts')
      .select('id, title, created_at, audio_url')
      .order('title')

    if (error) throw error

    // 按标题分组
    const titleMap = new Map<string, any[]>()

    for (const podcast of allPodcasts || []) {
      const title = podcast.title.trim().toLowerCase()
      if (!titleMap.has(title)) {
        titleMap.set(title, [])
      }
      titleMap.get(title)!.push(podcast)
    }

    // 找出重复的
    const duplicates = []
    for (const [title, podcasts] of titleMap.entries()) {
      if (podcasts.length > 1) {
        duplicates.push({
          title: podcasts[0].title,
          count: podcasts.length,
          podcasts: podcasts.map(p => ({
            id: p.id,
            created_at: p.created_at
          }))
        })
      }
    }

    return NextResponse.json({
      success: true,
      total: allPodcasts?.length || 0,
      unique: titleMap.size,
      duplicates: duplicates.length,
      details: duplicates
    })

  } catch (error: any) {
    console.error('查询失败:', error)
    return NextResponse.json({
      error: '查询失败',
      message: error.message
    }, { status: 500 })
  }
}
