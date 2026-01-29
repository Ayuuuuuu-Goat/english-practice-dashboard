// 测试音频URL是否可访问
const audioUrls = [
  'https://archive.org/download/Greatest_Speeches_of_the_20th_Century/MartinLutherKing-IHaveADream.mp3',
  'https://archive.org/download/MLKDream/MLKDream.mp3',
  'https://archive.org/download/GettysburgAddress/GettysburgAddress.mp3',
]

async function testUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    console.log(`✓ ${url}`)
    console.log(`  状态: ${response.status}`)
    console.log(`  类型: ${response.headers.get('content-type')}`)
    console.log(`  大小: ${response.headers.get('content-length')} bytes`)
    return true
  } catch (error) {
    console.log(`✗ ${url}`)
    console.log(`  错误: ${error.message}`)
    return false
  }
}

async function testAllUrls() {
  console.log('测试音频URL可访问性...\n')

  for (const url of audioUrls) {
    await testUrl(url)
    console.log('')
  }
}

testAllUrls()
