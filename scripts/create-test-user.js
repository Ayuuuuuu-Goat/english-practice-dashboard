const { createClient } = require('@supabase/supabase-js')

// 从环境变量获取配置
const supabaseUrl = 'https://mgjiwtrumkcmbhruqbou.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naml3dHJ1bWtjbWJocnVxYm91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc1NjgzNywiZXhwIjoyMDgwMzMyODM3fQ.T12oLmSY7_-rohMYtNEllfmZZSKkGmAhDXcgzi7rNLU'

// 使用 service role key 创建管理客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('正在创建测试账号...')

  const email = 'gina@test.com'
  const password = 'gina888'

  try {
    // 使用 admin API 创建用户
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // 自动确认邮箱
    })

    if (error) {
      console.error('创建用户失败:', error.message)
      return
    }

    console.log('✅ 测试账号创建成功!')
    console.log('邮箱:', email)
    console.log('密码:', password)
    console.log('用户ID:', data.user.id)
    console.log('\n现在可以使用这个账号登录了！')

  } catch (err) {
    console.error('发生错误:', err)
  }
}

createTestUser()
