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

async function deleteGinaData() {
  console.log('🔍 Looking for Gina user...')

  // 查找用户
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error listing users:', listError)
    return
  }

  const gina = users.find(u => u.email && u.email.toLowerCase().includes('gina@'))

  if (!gina) {
    console.log('⚠️  Gina user not found')
    return
  }

  console.log(`📧 Found user: ${gina.email} (ID: ${gina.id})`)

  const userId = gina.id

  // 删除发音练习数据
  const { error: e1 } = await supabase
    .from('pronunciation_attempts')
    .delete()
    .eq('user_id', userId)

  if (e1) {
    console.error('❌ Error deleting pronunciation_attempts:', e1)
  } else {
    console.log('✅ Deleted pronunciation_attempts')
  }

  // 删除每日练习统计
  const { error: e2 } = await supabase
    .from('daily_practice_stats')
    .delete()
    .eq('user_id', userId)

  if (e2) {
    console.error('❌ Error deleting daily_practice_stats:', e2)
  } else {
    console.log('✅ Deleted daily_practice_stats')
  }

  // 删除视频统计数据
  const { error: e3 } = await supabase
    .from('user_video_stats')
    .delete()
    .eq('user_id', userId)

  if (e3) {
    console.error('❌ Error deleting user_video_stats:', e3)
  } else {
    console.log('✅ Deleted user_video_stats')
  }

  // 删除视频打卡记录
  const { error: e4 } = await supabase
    .from('user_video_checkins')
    .delete()
    .eq('user_id', userId)

  if (e4) {
    console.error('❌ Error deleting user_video_checkins:', e4)
  } else {
    console.log('✅ Deleted user_video_checkins')
  }

  // 删除HN阅读统计
  const { error: e5 } = await supabase
    .from('user_hn_stats')
    .delete()
    .eq('user_id', userId)

  if (e5) {
    console.error('❌ Error deleting user_hn_stats:', e5)
  } else {
    console.log('✅ Deleted user_hn_stats')
  }

  // 删除对话会话结果
  const { error: e6 } = await supabase
    .from('conversation_session_results')
    .delete()
    .eq('user_id', userId)

  if (e6) {
    console.error('❌ Error deleting conversation_session_results:', e6)
  } else {
    console.log('✅ Deleted conversation_session_results')
  }

  // 最后删除用户
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)

  if (deleteUserError) {
    console.error('❌ Error deleting user:', deleteUserError)
  } else {
    console.log('✅ Deleted user account')
  }

  console.log('\n🎉 Gina data cleanup completed!')
}

deleteGinaData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
