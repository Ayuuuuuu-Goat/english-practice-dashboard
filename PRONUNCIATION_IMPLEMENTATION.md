# 每日词卡发音练习功能 - 实施指南

## 📋 实施完成清单

### ✅ 已完成的部分

#### 1. 数据库架构
- ✅ 创建了 SQL schema 文件 (`scripts/pronunciation-schema.sql`)
- ✅ 定义了4个主要表：
  - `word_cards` - 词卡表
  - `pronunciation_attempts` - 发音练习记录表
  - `user_pronunciation_settings` - 用户设置表
  - `daily_practice_stats` - 每日统计表
- ✅ 配置了 RLS (Row Level Security) 策略
- ✅ 预设了50个英语单词示例
- ✅ 创建了索引优化查询性能

#### 2. 后端 API
- ✅ Supabase Edge Function (`supabase/functions/evaluate-pronunciation/`)
  - `signature.ts` - 科大讯飞 HMAC-SHA256 签名生成
  - `iflytek-client.ts` - WebSocket 客户端
  - `index.ts` - 主评测逻辑
- ✅ Vercel Blob 上传 API (`app/api/pronunciation/upload-audio/route.ts`)

#### 3. 前端工具库
- ✅ `lib/pronunciation/types.ts` - TypeScript 类型定义
- ✅ `lib/pronunciation/audio-utils.ts` - 录音和音频处理工具
- ✅ `lib/pronunciation/word-selection.ts` - 智能词卡选择算法
- ✅ `lib/supabase/pronunciation-queries.ts` - 数据库查询函数

#### 4. UI 组件
- ✅ `components/pronunciation/audio-recorder.tsx` - 录音组件
- ✅ `components/pronunciation/word-card-display.tsx` - 词卡展示
- ✅ `components/pronunciation/score-display.tsx` - 评分结果展示
- ✅ `components/pronunciation/pronunciation-practice-page.tsx` - 主练习页面
- ✅ `components/pronunciation/pronunciation-stats.tsx` - 统计页面

#### 5. 应用集成
- ✅ 更新了 Sidebar 添加发音练习入口
- ✅ 更新了主页面路由逻辑

## 🚀 部署步骤

### 步骤 1: 数据库设置

1. 登录 Supabase Dashboard
2. 打开 SQL Editor
3. 执行 `scripts/pronunciation-schema.sql` 文件中的所有 SQL 语句
4. 验证表创建成功：
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%pronunciation%' OR table_name = 'word_cards');
```

### 步骤 2: 配置科大讯飞 API

1. 注册科大讯飞账号: https://www.xfyun.cn/
2. 创建应用获取凭据:
   - APPID: `ga8b82c6`
   - API_KEY: `d3c7a90d332a3ee97bbc710dcf45c746`
   - API_SECRET: `7e4dbedce4d8353423b031572fb27d13`

### 步骤 3: 部署 Edge Function

1. 安装 Supabase CLI:
```bash
npm install -g supabase
```

2. 登录 Supabase:
```bash
supabase login
```

3. 链接项目:
```bash
cd /Users/takanoriiwata/Downloads/english-practice-dashboard
supabase link --project-ref YOUR_PROJECT_REF
```

4. 设置 Edge Function 环境变量:
```bash
supabase secrets set IFLYTEK_APPID=ga8b82c6
supabase secrets set IFLYTEK_API_KEY=d3c7a90d332a3ee97bbc710dcf45c746
supabase secrets set IFLYTEK_API_SECRET=7e4dbedce4d8353423b031572fb27d13
supabase secrets set VERCEL_BLOB_READ_WRITE_TOKEN=your_token_here
```

5. 部署 Edge Function:
```bash
supabase functions deploy evaluate-pronunciation
```

### 步骤 4: 配置 Vercel Blob

1. 登录 Vercel Dashboard
2. 进入项目设置 > Storage > Blob
3. 创建 Blob Store (如果还没有)
4. 复制 `BLOB_READ_WRITE_TOKEN`
5. 添加到 Vercel 环境变量和本地 `.env.local`

### 步骤 5: 配置本地环境变量

创建 `.env.local` 文件:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### 步骤 6: 安装依赖并运行

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000，点击左侧菜单 "发音练习"

## 🧪 测试流程

### 1. 数据库测试
```sql
-- 检查预设词库
SELECT COUNT(*) FROM word_cards WHERE is_preset = true;

-- 检查 RLS 策略
SELECT * FROM pg_policies
WHERE tablename IN ('word_cards', 'pronunciation_attempts');
```

### 2. Edge Function 测试

使用 Postman 或 curl 测试：
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/evaluate-pronunciation' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "audio_url": "https://example.com/test.wav",
    "text": "hello",
    "language": "en",
    "category": "read_word",
    "user_id": "user_uuid",
    "word_card_id": "word_uuid"
  }'
```

### 3. 前端 E2E 测试

1. 打开发音练习页面
2. 点击"开始录音"按钮
3. 允许麦克风权限
4. 朗读单词
5. 停止录音
6. 检查评分结果显示
7. 检查数据库是否保存记录
8. 点击"下一个"继续练习

## 📊 关键功能说明

### 智能词卡选择算法

优先级排序规则：
1. **从未练习过的词** (优先级: 1000)
2. **分数低于70的词** (优先级: 800-900)
3. **7天以上未练习** (优先级: 500-700)
4. **最近练习且分数好** (优先级: 100-400)

### 音频处理流程

```
录音 → WAV转换(16kHz, 16-bit, Mono) → Vercel Blob上传 → 科大讯飞评测 → 结果存储
```

### 评分指标

- **总分** (total_score): 0-100
- **准确度** (accuracy_score): 发音准确性
- **流利度** (fluency_score): 语速和连贯性
- **完整度** (integrity_score): 是否读完整
- **音素分** (phone_score): 仅中文
- **声调分** (tone_score): 仅中文

## 🔧 故障排查

### 问题 1: 麦克风权限被拒绝
**解决**: 检查浏览器设置，确保允许网站访问麦克风

### 问题 2: Edge Function 超时
**解决**:
- 检查科大讯飞 API 凭据是否正确
- 确认网络连接正常
- 查看 Edge Function 日志: `supabase functions logs evaluate-pronunciation`

### 问题 3: 音频上传失败
**解决**:
- 验证 BLOB_READ_WRITE_TOKEN 是否有效
- 检查 Vercel Blob 存储空间是否充足

### 问题 4: 数据库查询失败
**解决**:
- 检查 RLS 策略是否正确配置
- 确认用户已登录且有权限

## 📈 性能优化建议

1. **音频压缩**: 已实现 16kHz 重采样，减少文件大小
2. **CDN 缓存**: Vercel Blob 自动 CDN 分发
3. **数据库索引**: 已创建关键字段索引
4. **并发控制**: 科大讯飞免费版限制 5 并发

## 💰 成本估算

- **科大讯飞 API**: 免费试用 5 并发，商用约 ¥0.002/次
- **Vercel Blob**: 免费 1GB，超出 $0.15/GB/月
- **Supabase**: 免费版足够开发测试

**预估月成本** (100次/天):
- API: ¥6/月
- Blob: ~$1/月 (假设平均 50KB/音频)
- **总计**: 约 ¥12/月

## 🔮 后续优化方向

1. **离线支持**: Service Worker 缓存词卡
2. **社交功能**: 排行榜、好友PK
3. **AI 推荐**: 基于学习曲线智能推荐
4. **多语言**: 支持中文发音评测
5. **游戏化**: 徽章、成就系统
6. **TTS 示范**: 播放标准发音示例

## 📚 参考资源

- [科大讯飞语音评测 API](https://global.xfyun.cn/doc/voiceservice/ise/API.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

## 🎯 快速启动命令

```bash
# 1. 安装依赖
pnpm install

# 2. 设置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入实际值

# 3. 部署 Edge Function
supabase functions deploy evaluate-pronunciation

# 4. 启动开发服务器
pnpm dev
```

---

**实施完成！开始享受发音练习吧！🎉**
