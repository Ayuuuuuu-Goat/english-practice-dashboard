#!/usr/bin/env node

/**
 * 批量转录所有播客
 *
 * 使用方法：
 * node scripts/transcribe-all.js [method]
 *
 * method: auto(默认) | openai | local
 */

async function transcribeAll() {
  const method = process.argv[2] || 'auto'

  console.log('🎤 批量转录播客')
  console.log(`转录方式: ${method}`)
  console.log('─'.repeat(50))

  try {
    // 1. 获取所有需要转录的播客
    console.log('\n📋 获取待转录播客列表...')
    const listResponse = await fetch('http://localhost:3000/api/podcasts/transcribe-whisper')
    const listData = await listResponse.json()

    if (!listData.success || !listData.podcasts || listData.podcasts.length === 0) {
      console.log('✅ 没有需要转录的播客')
      return
    }

    const podcasts = listData.podcasts
    console.log(`找到 ${podcasts.length} 个需要转录的播客\n`)

    let successCount = 0
    let errorCount = 0

    // 2. 逐个转录
    for (let i = 0; i < podcasts.length; i++) {
      const podcast = podcasts[i]
      console.log(`[${i + 1}/${podcasts.length}] ${podcast.title}`)

      try {
        const response = await fetch('http://localhost:3000/api/podcasts/transcribe-whisper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            podcastId: podcast.id,
            method: method
          })
        })

        const data = await response.json()

        if (data.success) {
          successCount++
          console.log(`   ✅ 成功 (${data.method})`)
          console.log(`   📝 转录文本长度: ${data.transcript?.length || 0} 字符`)
        } else {
          errorCount++
          console.log(`   ❌ 失败: ${data.error || data.message}`)
        }
      } catch (error) {
        errorCount++
        console.log(`   ❌ 错误: ${error.message}`)
      }

      // 避免API限流，等待2秒
      if (i < podcasts.length - 1) {
        console.log('   ⏳ 等待2秒...\n')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // 3. 输出总结
    console.log('\n' + '═'.repeat(50))
    console.log('📊 转录完成!')
    console.log(`✅ 成功: ${successCount}`)
    console.log(`❌ 失败: ${errorCount}`)
    console.log(`📁 总计: ${podcasts.length}`)
    console.log('═'.repeat(50))

  } catch (error) {
    console.error('\n❌ 批量转录失败:', error.message)
    process.exit(1)
  }
}

// 运行
transcribeAll()
