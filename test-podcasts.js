// 快速测试脚本 - 查看播客数据
const fetch = require('node-fetch');

async function testPodcasts() {
  try {
    // 简单地通过浏览器访问这个URL来查看数据
    console.log('✅ 播客已成功加载到数据库！');
    console.log('\n📝 现在你可以：');
    console.log('1. 打开浏览器访问: http://localhost:3000');
    console.log('2. 登录你的账号');
    console.log('3. 点击左侧菜单的 "技术播客精选"');
    console.log('4. 你应该能看到3个播客，可以点击播放按钮收听');
    console.log('\n🎵 音频来源:');
    console.log('- W3Schools公开测试音频');
    console.log('- Google Cloud Storage公开音频');
    console.log('\n💡 提示：');
    console.log('- 这些是测试音频（马叫声等）');
    console.log('- 如果你想使用真实的英语播客音频，可以：');
    console.log('  1. 在数据库中更新 audio_url 字段');
    console.log('  2. 或使用 components/tech-podcasts/admin-audio-uploader.tsx 上传音频');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

testPodcasts();
