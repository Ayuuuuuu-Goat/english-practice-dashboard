const https = require('https')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

const sql = `
-- 创建自定义角色表
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);

-- 启用行级安全
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Anyone can create custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Anyone can delete custom roles" ON custom_roles;

-- 创建策略：允许所有人读取
CREATE POLICY "Anyone can view custom roles" ON custom_roles
  FOR SELECT
  USING (true);

-- 创建策略：允许所有人插入
CREATE POLICY "Anyone can create custom roles" ON custom_roles
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人删除
CREATE POLICY "Anyone can delete custom roles" ON custom_roles
  FOR DELETE
  USING (true);
`

console.log('🔧 Creating custom_roles table...')
console.log(`📍 Project: ${projectRef}`)

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`
  }
}

const postData = JSON.stringify({ query: sql })

const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Table created successfully!')
      console.log('🎉 You can now create custom roles that sync across all browsers!')
    } else {
      console.log('⚠️  Note: Direct SQL execution via REST API might not be available.')
      console.log('📋 Please execute the SQL manually in Supabase dashboard:')
      console.log('=' .repeat(80))
      console.log(sql)
      console.log('=' .repeat(80))
      console.log(`\n🔗 Go to: https://supabase.com/dashboard/project/${projectRef}/editor`)
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Error:', error.message)
  console.log('\n📋 Please execute the SQL manually in Supabase dashboard:')
  console.log('=' .repeat(80))
  console.log(sql)
  console.log('=' .repeat(80))
  console.log(`\n🔗 Go to: https://supabase.com/dashboard/project/${projectRef}/editor`)
})

req.write(postData)
req.end()
