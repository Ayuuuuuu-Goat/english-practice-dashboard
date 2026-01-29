# HN AI 资讯阅读功能 - 设置指南

## 功能简介

每天从 Hacker News 自动抓取最热门的 AI 相关技术讨论，作为英语阅读学习材料。

**功能特点：**
- ✅ 自动筛选 AI 相关主题（LLM、GPT、Claude、机器学习等）
- ✅ 智能排序：优先最近 24 小时内且讨论热度高的文章
- ✅ 自动去重：相同 URL 或相似标题只保留一条
- ✅ 阅读打卡：记录学习进度和连续天数
- ✅ 笔记功能：记录关键信息和个人思考

---

## AI 关键词范围

系统会筛选包含以下关键词的文章：

### 1. 基础 AI 概念
- artificial intelligence, AI, machine learning, deep learning, neural network

### 2. 大语言模型
- LLM, large language model, foundation model, transformer, attention mechanism

### 3. 主流模型/公司
- GPT, Claude, Gemini, OpenAI, Anthropic, ChatGPT, PaLM, Bard

### 4. RAG 和 Agent
- RAG, retrieval augmented generation, agents, tool use, function calling

### 5. AI 编程
- vibe coding, AI coding, code generation, copilot, cursor, AI pair programming

### 6. 模型训练与评估
- model training, inference, fine-tuning, RLHF, eval, benchmark, prompt engineering

### 7. 多模态
- diffusion, multimodal, vision language model, stable diffusion, DALL-E, midjourney

---

## 设置步骤

### 1. 创建数据库表

在 Supabase SQL Editor 中执行：

```bash
psql -f scripts/hn-reading-schema.sql
```

或手动在 Supabase Dashboard → SQL Editor 中粘贴并执行 `scripts/hn-reading-schema.sql` 的内容。

### 2. 重启开发服务器

```bash
pnpm dev
```

### 3. 测试功能

1. 访问 http://localhost:3000
2. 点击左侧菜单 "HN AI 资讯"
3. 系统会自动从 Hacker News 抓取今日文章

---

## 工作原理

### 1. 数据获取流程

```
HN Top Stories API
    ↓
获取前 200 条热门故事 ID
    ↓
并行获取每条故事详情
    ↓
筛选 AI 相关内容（关键词匹配）
    ↓
按时间分类（24h / 72h）
    ↓
去重（URL + 标题相似度）
    ↓
按讨论度排序（score + comments）
    ↓
返回前 10 条
```

### 2. 排序策略

- **优先级 1**: 最近 24 小时内 + 高讨论度
- **优先级 2**: 24 小时内不足 10 条时，扩展到 72 小时
- **讨论度计算**: `score + descendants`（点赞数 + 评论数）

### 3. 去重逻辑

**第一步：URL 去重**
- 相同 URL 的文章保留讨论度更高的

**第二步：标题相似度去重**
- 使用词重叠率计算相似度
- 相似度阈值：70%
- 每组相似文章保留讨论度最高的

### 4. 缓存机制

- 每天抓取的文章会存储在数据库
- 同一天内重复访问直接从数据库读取，不会重复调用 HN API
- 节省 API 调用次数，提升响应速度

---

## API 说明

### Hacker News API

**无需 API Key**，完全免费使用。

**主要端点：**
- `/v0/topstories.json` - 获取热门故事 ID 列表
- `/v0/item/{id}.json` - 获取故事详情

**无速率限制**，官方文档：https://github.com/HackerNews/API

---

## 数据库表说明

### daily_hn_stories
存储每日抓取的 HN 文章

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| hn_id | INTEGER | HN 文章 ID（唯一） |
| title | TEXT | 标题 |
| url | TEXT | 外部链接 |
| text | TEXT | 正文内容 |
| score | INTEGER | 点赞数 |
| descendants | INTEGER | 评论数 |
| author | VARCHAR | 作者 |
| posted_at | TIMESTAMP | 发布时间 |
| assigned_date | DATE | 分配日期 |

### user_hn_readings
用户的阅读打卡记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| story_id | UUID | 文章 ID |
| read_completed | BOOLEAN | 是否完成阅读 |
| notes | TEXT | 阅读笔记 |
| reading_date | DATE | 阅读日期 |

### user_hn_stats
用户的阅读统计数据

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID（唯一） |
| total_stories_read | INTEGER | 总阅读数 |
| current_streak | INTEGER | 当前连续天数 |
| longest_streak | INTEGER | 最长连续天数 |
| last_reading_date | DATE | 最后阅读日期 |

---

## 故障排查

### 问题1: "No AI-related stories found"

**可能原因：**
- HN 当天没有足够的 AI 相关讨论
- 网络问题导致无法访问 HN API

**解决方案：**
- 检查网络连接
- 等待几小时后重试
- 查看 HN 网站是否正常访问

### 问题2: 文章重复出现

**可能原因：**
- 去重算法阈值设置不当

**解决方案：**
- 检查 `lib/hackernews/hn-api.ts` 中的 `titleSimilarity` 阈值（当前 0.7）
- 可以调高阈值（如 0.8）使去重更严格

### 问题3: 文章质量不理想

**可能原因：**
- 关键词过于宽泛

**解决方案：**
- 编辑 `lib/hackernews/hn-api.ts` 中的 `AI_KEYWORDS` 数组
- 添加更具体的关键词或移除通用词

---

## 进阶定制

### 修改文章数量

编辑 `app/api/hn/daily/route.ts`：

```typescript
const hnStories = await getAIRelatedStories({
  maxStories: 20, // 改为 20 篇
  hoursLimit24: 15, // 24小时内目标数量
})
```

### 调整时间范围

编辑 `lib/hackernews/hn-api.ts`：

```typescript
const hours24Ago = now - (24 * 60 * 60) // 24小时
const hours72Ago = now - (7 * 24 * 60 * 60) // 改为 7 天
```

### 添加新的关键词

编辑 `lib/hackernews/hn-api.ts`：

```typescript
const AI_KEYWORDS = [
  // 现有关键词...

  // 添加新关键词
  'neural network', 'reinforcement learning', 'computer vision',
]
```

### 调整相似度阈值

编辑 `lib/hackernews/hn-api.ts`：

```typescript
if (similarity > 0.8) { // 从 0.7 调整到 0.8
  // 更严格的去重
}
```

---

## 常见问题

**Q: 能手动刷新今日文章吗？**
A: 可以。在数据库中删除今天的记录，刷新页面即可重新抓取。

**Q: 文章内容质量如何保证？**
A: 系统通过多重筛选：
1. HN 热门榜单（已经过社区筛选）
2. AI 关键词匹配
3. 讨论度排序（高质量文章通常有更多讨论）

**Q: 能否支持其他主题？**
A: 可以。修改 `AI_KEYWORDS` 数组，添加你感兴趣的关键词即可。

**Q: 为什么不直接抓取所有 HN 文章？**
A: 为了：
1. 保持主题聚焦（AI 技术）
2. 控制阅读量（避免信息过载）
3. 提升内容质量（精选而非全量）

---

## 技术支持

如有问题，请检查：
1. 浏览器控制台日志
2. Next.js 服务器日志
3. Supabase 日志

或创建 Issue 反馈问题。
