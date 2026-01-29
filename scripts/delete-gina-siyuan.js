const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteGinaSiyuanData() {
  console.log('🔍 Looking for Gina.Siyuan user...')

  // 查找用户
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error listing users:', listError)
    return
  }

  const ginaSiyuan = users.find(u => u.email && u.email.includes('gina.siyuan'))

  if (!ginaSiyuan) {
    console.log('⚠️  Gina.Siyuan user not found')
    return
  }

  console.log(`📧 Found user: ${ginaSiyuan.email} (ID: ${ginaSiyuan.id})`)

  // 删除相关数据
  const userId = ginaSiyuan.id

  // 删除发音练习数据
  const { error: e1 } = await supabase
    .from('daily_practice_stats')
    .delete()
    .eq('user_id', userId)

  if (e1) {
    console.error('❌ Error deleting daily_practice_stats:', e1)
  } else {
    console.log('✅ Deleted daily_practice_stats')
  }

  // 删除视频统计数据
  const { error: e2 } = await supabase
    .from('user_video_stats')
    .delete()
    .eq('user_id', userId)

  if (e2) {
    console.error('❌ Error deleting user_video_stats:', e2)
  } else {
    console.log('✅ Deleted user_video_stats')
  }

  // 删除HN阅读统计
  const { error: e3 } = await supabase
    .from('user_hn_stats')
    .delete()
    .eq('user_id', userId)

  if (e3) {
    console.error('❌ Error deleting user_hn_stats:', e3)
  } else {
    console.log('✅ Deleted user_hn_stats')
  }

  // 删除对话会话结果
  const { error: e4 } = await supabase
    .from('conversation_session_results')
    .delete()
    .eq('user_id', userId)

  if (e4) {
    console.error('❌ Error deleting conversation_session_results:', e4)
  } else {
    console.log('✅ Deleted conversation_session_results')
  }

  // 删除HN阅读记录
  const { error: e5 } = await supabase
    .from('user_hn_reading')
    .delete()
    .eq('user_id', userId)

  if (e5) {
    console.error('❌ Error deleting user_hn_reading:', e5)
  } else {
    console.log('✅ Deleted user_hn_reading')
  }

  // 删除视频打卡记录
  const { error: e6 } = await supabase
    .from('user_video_checkins')
    .delete()
    .eq('user_id', userId)

  if (e6) {
    console.error('❌ Error deleting user_video_checkins:', e6)
  } else {
    console.log('✅ Deleted user_video_checkins')
  }

  // 最后删除用户
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)

  if (deleteUserError) {
    console.error('❌ Error deleting user:', deleteUserError)
  } else {
    console.log('✅ Deleted user account')
  }

  console.log('\n🎉 Gina.Siyuan data cleanup completed!')
}

deleteGinaSiyuanData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
