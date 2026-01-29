const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://mgjiwtrumkcmbhruqbou.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naml3dHJ1bWtjbWJocnVxYm91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc1NjgzNywiZXhwIjoyMDgwMzMyODM3fQ.T12oLmSY7_-rohMYtNEllfmZZSKkGmAhDXcgzi7rNLU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('开始数据库迁移...')

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'add-user-id-to-practice-records.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // 分割 SQL 语句（按分号和换行符）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`找到 ${statements.length} 条 SQL 语句`)

    // 执行每条 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n执行语句 ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 100) + '...')

      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`❌ 执行失败:`, error.message)
        // 继续执行下一条，因为有些语句可能已经存在
      } else {
        console.log('✅ 执行成功')
      }
    }

    console.log('\n✅ 数据库迁移完成！')
    console.log('\n注意：请前往 Supabase Dashboard 手动执行 SQL 语句')
    console.log('路径：https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou/editor')
    console.log('复制 add-user-id-to-practice-records.sql 的内容并执行')

  } catch (err) {
    console.error('❌ 迁移失败:', err)
  }
}

runMigration()
