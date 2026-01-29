import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailToUUID } from '@/lib/user-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 获取所有自定义角色
export async function GET() {
  try {
    const { data: roles, error } = await supabase
      .from('custom_roles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, roles: roles || [] })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 创建新角色
export async function POST(request: NextRequest) {
  try {
    const { name, email, color, icon } = await request.json()

    if (!name || !email || !color || !icon) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 检查角色名是否已存在
    const { data: existing } = await supabase
      .from('custom_roles')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Role name already exists' },
        { status: 400 }
      )
    }

    // 创建角色
    const { data: role, error } = await supabase
      .from('custom_roles')
      .insert({
        name,
        email,
        color,
        icon
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, role })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const deleteData = searchParams.get('deleteData') === 'true'

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing role name' },
        { status: 400 }
      )
    }

    // 如果需要删除数据，先获取角色的email
    if (deleteData) {
      // 获取角色信息
      const { data: role } = await supabase
        .from('custom_roles')
        .select('email')
        .eq('name', name)
        .single()

      if (role?.email) {
        // 删除该用户的所有学习数据（使用user_id字段，值为从email生成的UUID）
        const userId = emailToUUID(role.email)

        // 删除发音练习数据
        await supabase
          .from('pronunciation_attempts')
          .delete()
          .eq('user_id', userId)

        // 删除每日统计数据
        await supabase
          .from('daily_practice_stats')
          .delete()
          .eq('user_id', userId)

        // 删除视频统计数据
        await supabase
          .from('user_video_stats')
          .delete()
          .eq('user_id', userId)

        // 删除视频签到数据
        await supabase
          .from('user_video_checkins')
          .delete()
          .eq('user_id', userId)

        // 删除HN阅读统计数据
        await supabase
          .from('user_hn_stats')
          .delete()
          .eq('user_id', userId)

        // 删除AI对话结果数据
        await supabase
          .from('conversation_session_results')
          .delete()
          .eq('user_id', userId)
      }
    }

    // 删除角色
    const { error } = await supabase
      .from('custom_roles')
      .delete()
      .eq('name', name)

    if (error) {
      console.error('Error deleting role:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
