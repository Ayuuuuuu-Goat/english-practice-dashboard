// Hacker News API 工具函数
import axios from 'axios'

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_API = 'https://hn.algolia.com/api/v1'

// AI 相关关键词配置（分级系统）
const AI_KEYWORDS = {
  // 核心模型和公司（高权重 - 出现在标题几乎确定是AI相关）
  critical: [
    'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'chatgpt',
    'llm', 'large language model', 'foundation model',
    'reasoning model', 'o1', 'o3', // OpenAI 新模型
    'palm', 'bard',
  ],

  // 技术概念（中权重）
  technical: [
    'machine learning', 'deep learning', 'neural network', 'transformer',
    'attention mechanism', 'fine-tuning', 'rlhf', 'prompt engineering',
    'rag', 'retrieval augmented generation', 'embedding', 'vector database',
    'agent', 'agentic', 'tool use', 'function calling', 'mcp',
    'diffusion', 'multimodal', 'vision language model',
    'model training', 'inference', 'eval', 'benchmark',
  ],

  // 应用场景（低权重 - 需要与高权重词组合）
  application: [
    'ai coding', 'code generation', 'copilot', 'cursor', 'ai pair programming',
    'stable diffusion', 'dall-e', 'midjourney', 'sora',
    'vibe coding',
  ],

  // 排除词（出现这些词降低相关度）
  exclude: [
    'cryptocurrency', 'blockchain', 'nft', 'crypto', 'bitcoin',
  ]
}

export interface HNStory {
  id: number
  title: string
  url?: string
  text?: string
  score: number
  descendants: number
  by: string
  time: number
  type: string
}

// 获取故事详情
async function getStoryDetails(id: number): Promise<HNStory | null> {
  try {
    const response = await axios.get(`${HN_API_BASE}/item/${id}.json`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch story ${id}:`, error)
    return null
  }
}

// 计算 AI 相关性评分（权重系统）
function calculateAIRelevanceScore(story: HNStory): number {
  let score = 0
  const title = story.title.toLowerCase()
  const text = (story.text || '').toLowerCase()
  const url = (story.url || '').toLowerCase()

  // 1. 标题匹配（权重3x - 标题最能体现主题）
  for (const keyword of AI_KEYWORDS.critical) {
    if (title.includes(keyword)) score += 30
  }
  for (const keyword of AI_KEYWORDS.technical) {
    if (title.includes(keyword)) score += 15
  }
  for (const keyword of AI_KEYWORDS.application) {
    if (title.includes(keyword)) score += 10
  }

  // 2. URL匹配（权重2x - 博客路径通常很明确）
  for (const keyword of AI_KEYWORDS.critical) {
    if (url.includes(keyword)) score += 20
  }
  for (const keyword of AI_KEYWORDS.technical) {
    if (url.includes(keyword)) score += 10
  }

  // 3. 正文匹配（权重1x）
  for (const keyword of AI_KEYWORDS.critical) {
    if (text.includes(keyword)) score += 10
  }
  for (const keyword of AI_KEYWORDS.technical) {
    if (text.includes(keyword)) score += 5
  }

  // 4. 排除词惩罚
  for (const keyword of AI_KEYWORDS.exclude) {
    if (title.includes(keyword)) score -= 50
    if (text.includes(keyword)) score -= 20
  }

  return score
}

// 检查故事是否与 AI 相关
function isAIRelated(story: HNStory): boolean {
  const score = calculateAIRelevanceScore(story)
  // 评分阈值：30分以上认为是AI相关
  // 标题包含1个critical关键词 = 30分
  // 标题包含2个technical关键词 = 30分
  return score >= 30
}

// 检查是否有实质性内容（HN原文或外链）
function hasSubstantialContent(story: HNStory): boolean {
  // 有HN原文(>200字符)
  if (story.text && story.text.length > 200) {
    return true
  }
  // 或者有外链URL（将被抓取）
  if (story.url) {
    return true
  }
  return false
}

// 计算故事的优先级分数
function calculatePriority(story: HNStory): number {
  let score = story.score + story.descendants

  // 有实质性文本内容的帖子加分（优先级更高）
  if (hasSubstantialText(story)) {
    score += 1000 // 大幅加分，确保优先显示
  }

  return score
}

// 计算标题相似度（简单的词重叠率）
function titleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/)
  const words2 = title2.toLowerCase().split(/\s+/)

  const set1 = new Set(words1)
  const set2 = new Set(words2)

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

// 去重：移除重复 URL 和相似标题
function deduplicateStories(stories: HNStory[]): HNStory[] {
  const urlMap = new Map<string, HNStory>()
  const titleGroups: HNStory[][] = []

  // 第一步：按 URL 去重
  for (const story of stories) {
    if (story.url) {
      const existing = urlMap.get(story.url)
      if (!existing || story.score + story.descendants > existing.score + existing.descendants) {
        urlMap.set(story.url, story)
      }
    } else {
      // 没有 URL 的故事（如 Ask HN）直接保留
      titleGroups.push([story])
    }
  }

  // 收集按 URL 去重后的故事
  const uniqueByUrl = Array.from(urlMap.values())

  // 第二步：标题相似度去重
  for (const story of uniqueByUrl) {
    let merged = false
    for (const group of titleGroups) {
      const similarity = titleSimilarity(story.title, group[0].title)
      if (similarity > 0.7) { // 70% 相似度阈值
        group.push(story)
        merged = true
        break
      }
    }
    if (!merged) {
      titleGroups.push([story])
    }
  }

  // 每组保留讨论度最高的
  return titleGroups.map(group =>
    group.reduce((best, current) =>
      (current.score + current.descendants) > (best.score + best.descendants) ? current : best
    )
  )
}

// 获取 AI 相关的 HN 故事（使用 Algolia Search API，更快更高效）
export async function getAIRelatedStories(params: {
  maxStories?: number
  hoursLimit24?: number // 24 小时内的故事数量目标
}): Promise<HNStory[]> {
  const { maxStories = 10 } = params

  try {
    console.log('Searching AI-related stories via Algolia API...')

    const now = Math.floor(Date.now() / 1000)
    const threeDaysAgo = now - (72 * 60 * 60)

    // 构建搜索查询：使用核心AI关键词
    const searchQueries = [
      'GPT', 'Claude', 'ChatGPT', 'OpenAI', 'Anthropic',
      'LLM', 'AI', 'machine learning', 'deep learning'
    ]

    const allStories: HNStory[] = []

    // 对每个关键词搜索
    for (const query of searchQueries) {
      try {
        const response = await axios.get(`${HN_ALGOLIA_API}/search`, {
          params: {
            query,
            tags: 'story',
            numericFilters: `created_at_i>${threeDaysAgo}`,
            hitsPerPage: 20, // 每个关键词取20篇
          },
          timeout: 5000,
        })

        const hits = response.data.hits || []

        for (const hit of hits) {
          // 过滤掉没有标题的
          if (!hit.title) continue

          // 转换Algolia格式到HNStory格式
          const story: HNStory = {
            id: parseInt(hit.objectID) || 0,
            title: hit.title,
            url: hit.url || undefined,
            text: hit.story_text || undefined,
            score: hit.points || 0,
            descendants: hit.num_comments || 0,
            by: hit.author || 'unknown',
            time: hit.created_at_i || Math.floor(Date.now() / 1000),
            type: 'story',
          }

          // 验证是否真的AI相关（使用我们的评分系统）
          if (isAIRelated(story) && hasSubstantialContent(story)) {
            allStories.push(story)
          }
        }

        console.log(`Found ${hits.length} results for "${query}"`)
      } catch (error) {
        console.error(`Error searching for "${query}":`, error)
        // 继续搜索其他关键词
      }
    }

    console.log(`Total stories found: ${allStories.length}`)

    // 去重
    const deduplicated = deduplicateStories(allStories)
    console.log(`After deduplication: ${deduplicated.length}`)

    // 按热度排序（分数 + 评论数）
    const sorted = deduplicated.sort((a, b) => {
      const scoreA = (a.score || 0) + (a.descendants || 0)
      const scoreB = (b.score || 0) + (b.descendants || 0)
      return scoreB - scoreA
    })

    // 返回前 N 条
    const result = sorted.slice(0, maxStories)
    console.log(`Returning top ${result.length} AI stories`)

    return result
  } catch (error) {
    console.error('Error fetching HN stories:', error)
    throw error
  }
}

// 格式化时间戳为可读格式
export function formatHNTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes} 分钟前`
  } else if (hours < 24) {
    return `${hours} 小时前`
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
