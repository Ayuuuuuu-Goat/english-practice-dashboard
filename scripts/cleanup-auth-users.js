const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupAuthUsers() {
  console.log('🧹 Cleaning up auth.users...')

  try {
    // 获取所有auth用户
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }

    console.log(`\n📋 Found ${users.length} users in auth.users:`)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`)
    })

    // 获取所有自定义角色
    const { data: customRoles, error: rolesError } = await supabase
      .from('custom_roles')
      .select('name, email')

    if (rolesError) {
      console.error('❌ Error fetching custom roles:', rolesError)
      return
    }

    // 默认角色
    const defaultRoles = ['viewer@example.com']

    // 所有有效的email
    const validEmails = [
      ...defaultRoles,
      ...(customRoles || []).map(r => r.email.toLowerCase())
    ]

    console.log(`\n✅ Valid emails (from custom_roles):`)
    validEmails.forEach(email => console.log(`  - ${email}`))

    // 找出需要删除的用户
    const usersToDelete = users.filter(user =>
      !validEmails.includes(user.email?.toLowerCase())
    )

    if (usersToDelete.length === 0) {
      console.log('\n✅ No users to delete. All auth users are valid!')
      return
    }

    console.log(`\n🗑️  Found ${usersToDelete.length} users to delete:`)
    usersToDelete.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`)
    })

    // 删除这些用户
    for (const user of usersToDelete) {
      console.log(`\n🗑️  Deleting ${user.email}...`)

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        console.error(`  ❌ Failed to delete ${user.email}:`, deleteError)
      } else {
        console.log(`  ✅ Deleted ${user.email}`)
      }
    }

    console.log('\n✅ Cleanup complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

cleanupAuthUsers()
