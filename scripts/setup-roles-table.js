const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function setupRolesTable() {
  console.log('🔧 Setting up custom_roles table...')

  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'create-roles-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // 执行SQL（注意：Supabase客户端不能直接执行DDL，需要手动在控制台执行）
    console.log('\n📋 Please execute the following SQL in Supabase SQL Editor:')
    console.log('=' .repeat(80))
    console.log(sql)
    console.log('=' .repeat(80))
    console.log('\n✅ After executing the SQL, the custom_roles table will be ready!')
    console.log('🔗 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

setupRolesTable()
