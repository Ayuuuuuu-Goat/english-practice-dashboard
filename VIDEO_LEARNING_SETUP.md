# 每日视频学习功能 - 设置指南

## 功能简介

每日视频学习功能会自动从YouTube抓取高质量的英语学习视频作为每日打卡任务。

**功能特点：**
- ✅ 每天自动推荐一个英语学习视频（0-15分钟）
- ✅ 支持三种视频类型：日常会话、商务英语、发音技巧
- ✅ 记录学习笔记
- ✅ 打卡统计：连续天数、总观看时长等
- ✅ YouTube视频直接嵌入播放

---

## 设置步骤

### 1. 获取YouTube API密钥

#### 1.1 访问Google Cloud Console
前往：https://console.cloud.google.com/

#### 1.2 创建或选择项目
- 点击顶部的项目选择器
- 点击"新建项目"或选择现有项目

#### 1.3 启用YouTube Data API v3
1. 在左侧菜单中，选择"API和服务" → "库"
2. 搜索"YouTube Data API v3"
3. 点击进入并点击"启用"按钮

#### 1.4 创建API密钥
1. 在左侧菜单中，选择"API和服务" → "凭据"
2. 点击"创建凭据" → "API密钥"
3. 复制生成的API密钥

#### 1.5 （可选）限制API密钥
为了安全，建议限制API密钥的使用：
- 点击刚创建的API密钥进入设置
- 在"API限制"中选择"限制密钥"
- 只选择"YouTube Data API v3"
- 保存

### 2. 配置环境变量

编辑 `.env.local` 文件，添加：

```bash
YOUTUBE_API_KEY=你的API密钥
```

### 3. 创建数据库表

在Supabase SQL Editor中执行：

```bash
psql -f scripts/video-learning-schema.sql
```

或手动在Supabase Dashboard → SQL Editor中粘贴并执行 `scripts/video-learning-schema.sql` 的内容。

### 4. 重启开发服务器

```bash
pnpm dev
```

### 5. 测试功能

1. 访问 http://localhost:3000
2. 点击左侧菜单"每日视频"
3. 应该能看到今日推荐的YouTube视频

---

## API配额说明

YouTube Data API v3 有免费配额限制：

- **每日配额**：10,000 单位/天
- **搜索操作**：100 单位/次
- **视频详情**：1 单位/次

本功能的消耗：
- 每日刷新视频：约 100-200 单位
- 正常使用下，免费配额完全足够

如果需要更高配额，可以在Google Cloud Console申请提升。

---

## 故障排查

### 问题1: "YouTube API key not configured"
**解决方案**：
- 检查 `.env.local` 中是否正确设置了 `YOUTUBE_API_KEY`
- 重启开发服务器

### 问题2: "No suitable video found"
**可能原因**：
- YouTube API返回的视频不符合时长要求（超过15分钟）
- 网络问题
- API配额用完

**解决方案**：
- 检查网络连接
- 查看Google Cloud Console配额使用情况
- 等待24小时后配额重置

### 问题3: 视频无法播放
**可能原因**：
- YouTube视频设置不允许嵌入
- 视频已被删除

**解决方案**：
- 等待第二天自动刷新新视频
- 或手动在数据库中删除今日视频记录，强制刷新

---

## 数据库表说明

### daily_videos
存储每日推荐的视频信息

### user_video_checkins
用户的视频打卡记录

### user_video_stats
用户的学习统计数据（连续天数、总观看时长等）

---

## 进阶定制

### 修改视频搜索关键词

编辑 `lib/youtube/youtube-api.ts`，修改 `queries` 对象：

```typescript
const queries: Record<string, string> = {
  日常会话: 'english conversation practice daily english speaking',
  商务英语: 'business english professional communication workplace english',
  发音技巧: 'english pronunciation tips accent training speaking clearly',
}
```

### 调整视频时长限制

编辑 `app/api/video/daily/route.ts`，修改 `maxDuration` 参数：

```typescript
const video = await getRandomDailyVideo({
  apiKey: YOUTUBE_API_KEY,
  categories: categories,
  maxDuration: 1800, // 改为30分钟 (1800秒)
})
```

---

## 常见问题

**Q: 可以手动更换视频吗？**
A: 可以。在数据库中删除今天的视频记录，刷新页面即可自动获取新视频。

**Q: 视频内容质量如何保证？**
A: 系统使用精心设计的搜索关键词，并优先选择高观看量的视频。如果发现不合适的视频，可以调整搜索关键词。

**Q: 能否支持其他语言的视频？**
A: 可以。修改 `lib/youtube/youtube-api.ts` 中的搜索关键词和 `relevanceLanguage` 参数即可。

---

## 技术支持

如有问题，请检查：
1. 浏览器控制台日志
2. Next.js服务器日志
3. Supabase日志

或创建Issue反馈问题。
