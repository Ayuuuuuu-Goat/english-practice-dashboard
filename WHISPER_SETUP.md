# Whisper音频转录集成指南

##  已完成的修改

### ✅ 前端改进
1. **删除了生词和听写标签**
   - 只保留"收听与文本对照"标签
   - 简化了界面，专注于音频学习

2. **新增TranscriptViewer组件**
   - 📍 **时间轴同步**：当前播放位置的句子自动高亮
   - 🖱️ **点击跳转**：点击任意句子跳转到对应时间点
   - 📜 **自动滚动**：当前句子自动滚动到视野中心
   - 💾 **下载功能**：支持下载完整转录文本

### ✅ 后端API
创建了三个转录API：

1. `/api/podcasts/transcribe` - 基础OpenAI Whisper API
2. `/api/podcasts/transcribe-whisper` - 完整转录方案（OpenAI + 本地）
3. 自动选择最佳转录方式

## 🚀 使用Whisper转录音频

### 方案1: 使用OpenAI Whisper API（推荐）

**优点**：
- ✅ 不需要安装任何东西
- ✅ 速度快，质量高
- ✅ 自动生成时间戳

**步骤**：

1. **获取OpenAI API Key**
   - 访问: https://platform.openai.com/api-keys
   - 创建新的API key

2. **添加到环境变量**
   ```bash
   # 编辑 .env.local
   echo "OPENAI_API_KEY=你的API_KEY" >> .env.local
   ```

3. **转录播客**
   ```bash
   # 转录单个播客
   curl -X POST http://localhost:3000/api/podcasts/transcribe-whisper \
     -H "Content-Type: application/json" \
     -d '{"podcastId": "播客ID", "method": "openai"}'
   ```

### 方案2: 使用本地Whisper（免费）

**优点**：
- ✅ 完全免费
- ✅ 隐私保护，数据不上传
- ✅ 支持离线使用

**步骤**：

1. **安装Whisper**
   ```bash
   pip install openai-whisper

   # 或使用faster-whisper（更快）
   pip install faster-whisper
   ```

2. **测试安装**
   ```bash
   whisper --help
   ```

3. **转录播客**
   ```bash
   curl -X POST http://localhost:3000/api/podcasts/transcribe-whisper \
     -H "Content-Type: application/json" \
     -d '{"podcastId": "播客ID", "method": "local"}'
   ```

### 方案3: 使用Whisper-WebUI（可视化）

这是你推荐的项目，提供了友好的Web界面。

**步骤**：

1. **克隆并安装**
   ```bash
   git clone https://github.com/jhj0517/Whisper-WebUI.git
   cd Whisper-WebUI
   pip install -r requirements.txt
   ```

2. **启动服务**
   ```bash
   python app.py
   ```
   服务会在 http://localhost:7860 启动

3. **手动转录**
   - 打开浏览器访问 http://localhost:7860
   - 上传音频文件
   - 选择模型（推荐：base或small）
   - 点击转录
   - 复制转录结果到你的播客

4. **或通过API自动化**
   ```javascript
   // 如果Whisper-WebUI支持API调用
   fetch('http://localhost:7860/api/transcribe', {
     method: 'POST',
     body: formData
   })
   ```

## 📝 转录所有现有播客

### 自动批量转录

```bash
# 1. 查看需要转录的播客
curl http://localhost:3000/api/podcasts/transcribe-whisper

# 2. 转录所有播客（需要写个简单脚本）
node scripts/transcribe-all.js
```

创建 `scripts/transcribe-all.js`:
```javascript
const fetch = require('node-fetch')

async function transcribeAll() {
  // 获取所有需要转录的播客
  const response = await fetch('http://localhost:3000/api/podcasts/transcribe-whisper')
  const { podcasts } = await response.json()

  console.log(`找到 ${podcasts.length} 个需要转录的播客`)

  for (const podcast of podcasts) {
    console.log(`\\n转录: ${podcast.title}`)

    try {
      const result = await fetch('http://localhost:3000/api/podcasts/transcribe-whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podcastId: podcast.id,
          method: 'auto' // 自动选择最佳方式
        })
      })

      const data = await result.json()
      if (data.success) {
        console.log(`✅ 成功 (${data.method})`)
      } else {
        console.log(`❌ 失败: ${data.error}`)
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`)
    }

    // 避免API限流
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\\n✅ 批量转录完成!')
}

transcribeAll()
```

运行：
```bash
node scripts/transcribe-all.js
```

## ⚙️ Whisper模型选择

| 模型 | 大小 | 速度 | 质量 | 推荐场景 |
|------|------|------|------|----------|
| tiny | 39M | 🚀🚀🚀 | ⭐⭐ | 快速测试 |
| base | 74M | 🚀🚀 | ⭐⭐⭐ | **推荐：平衡** |
| small | 244M | 🚀 | ⭐⭐⭐⭐ | 高质量 |
| medium | 769M | 🐢 | ⭐⭐⭐⭐⭐ | 最高质量 |
| large | 1550M | 🐌 | ⭐⭐⭐⭐⭐⭐ | 专业使用 |

**推荐**：对于英语播客，使用 `base` 或 `small` 模型即可。

## 💡 最佳实践

### 1. 转录流程

```
下载播客 → 保存音频 → 运行Whisper → 更新数据库 → 前端展示
```

### 2. 性能优化

- **使用faster-whisper**: 比原版快4-5倍
  ```bash
  pip install faster-whisper
  ```

- **批量转录**: 避免频繁调用API
- **缓存结果**: 转录一次，永久使用

### 3. 成本控制（OpenAI API）

- **Whisper API定价**: $0.006 / 分钟
- **示例**：30分钟播客 = $0.18
- **10个播客**（各30分钟）= $1.80

对于大量内容，考虑使用本地Whisper。

## 🎯 前端展示效果

转录完成后，前端会自动展示：

```
┌─────────────────────────────────────┐
│ 🎵 音频播放器                        │
│ [█████████░░░░] 2:30 / 7:00         │
│ ▶️ ⏪ ⏩ 🔊                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 文本对照                          │
├─────────────────────────────────────┤
│ [0:00] Welcome to today's episode.  │ ← 非当前句子
│                                     │
│ [0:15] ★ Today we're talking about │ ← 当前播放（高亮）
│        AI and machine learning.     │
│                                     │
│ [0:30] Let me share three insights. │ ← 未播放
├─────────────────────────────────────┤
│ 💡 点击任意句子跳转到对应时间点        │
└─────────────────────────────────────┘
```

## 🔧 故障排除

### 问题1: Whisper命令未找到

```bash
# 确认安装
pip list | grep whisper

# 重新安装
pip install --upgrade openai-whisper
```

### 问题2: 内存不足

使用更小的模型：
```bash
whisper audio.mp3 --model tiny  # 最小模型
```

### 问题3: 转录结果不准确

- 使用更大的模型（small或medium）
- 指定正确的语言：`--language en`
- 提高音频质量

### 问题4: OpenAI API限流

- 添加延迟：每次转录后等待2秒
- 使用批处理队列
- 或使用本地Whisper

## 📚 参考资源

- **OpenAI Whisper**: https://github.com/openai/whisper
- **Faster Whisper**: https://github.com/guillaumekln/faster-whisper
- **Whisper-WebUI**: https://github.com/jhj0517/Whisper-WebUI
- **OpenAI API文档**: https://platform.openai.com/docs/guides/speech-to-text

## 🎉 完成！

现在你的播客应用已经：
- ✅ 删除了生词和听写功能
- ✅ 改进了文本对照界面
- ✅ 支持时间轴同步和高亮
- ✅ 集成了Whisper转录API
- ✅ 支持点击跳转

刷新浏览器页面，体验全新的播客学习界面！
