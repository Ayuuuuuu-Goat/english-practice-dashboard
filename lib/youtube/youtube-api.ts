// YouTube API 工具函数
import axios from 'axios'

// 配置axios实例
const axiosInstance = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
})

// 辅助函数：使用axios并带重试机制
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries} to fetch:`, url.substring(0, 100) + '...')

      const response = await axiosInstance.get(url)
      console.log(`Success! Got ${JSON.stringify(response.data).length} bytes`)

      return response.data
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error.message)

      if (i === retries - 1) {
        throw error
      }

      // 等待后重试（递增延迟）
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
    }
  }
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: number // 秒
  channelTitle: string
  publishedAt: string
  category: string
  viewCount: number
}

// 将ISO 8601时长转换为秒
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

// 搜索YouTube视频
export async function searchYouTubeVideos(params: {
  apiKey: string
  query: string
  maxResults?: number
  maxDuration?: number // 最大时长（秒）
}): Promise<YouTubeVideo[]> {
  const { apiKey, query, maxResults = 10, maxDuration = 900 } = params

  try {
    // 第一步：搜索视频
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', String(maxResults))
    searchUrl.searchParams.set('videoDuration', 'medium') // 4-20分钟
    searchUrl.searchParams.set('videoEmbeddable', 'true')
    searchUrl.searchParams.set('videoSyndicated', 'true')
    searchUrl.searchParams.set('relevanceLanguage', 'en')
    searchUrl.searchParams.set('key', apiKey)

    console.log('Searching YouTube...')
    const searchData = await fetchWithRetry(searchUrl.toString())

    console.log('YouTube search returned:', searchData.items?.length || 0, 'videos')
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

    if (!videoIds) {
      return []
    }

    // 第二步：获取视频详情（包括时长）
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics')
    detailsUrl.searchParams.set('id', videoIds)
    detailsUrl.searchParams.set('key', apiKey)

    console.log('Fetching video details for', videoIds.split(',').length, 'videos')
    const detailsData = await fetchWithRetry(detailsUrl.toString())

    console.log('YouTube details returned:', detailsData.items?.length || 0, 'videos')

    // 解析视频数据并过滤时长
    const videos: YouTubeVideo[] = detailsData.items
      .map((item: any) => {
        const duration = parseDuration(item.contentDetails.duration)
        return {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          duration,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          category: '', // 稍后根据查询设置
          viewCount: parseInt(item.statistics.viewCount || '0'),
        }
      })
      .filter((video: YouTubeVideo) => video.duration > 0 && video.duration <= maxDuration)

    return videos
  } catch (error) {
    console.error('Error searching YouTube videos:', error)
    throw error
  }
}

// 获取英语学习视频
export async function getEnglishLearningVideos(params: {
  apiKey: string
  category: '日常会话' | '商务英语' | '发音技巧'
  maxDuration?: number
}): Promise<YouTubeVideo[]> {
  const { apiKey, category, maxDuration = 900 } = params

  // 根据类别构建搜索查询
  const queries: Record<string, string> = {
    日常会话: 'english conversation practice daily english speaking',
    商务英语: 'business english professional communication workplace english',
    发音技巧: 'english pronunciation tips accent training speaking clearly',
  }

  const query = queries[category]
  const videos = await searchYouTubeVideos({
    apiKey,
    query,
    maxResults: 20,
    maxDuration,
  })

  // 设置类别
  return videos.map(video => ({
    ...video,
    category,
  }))
}

// 从多个类别中随机选择一个视频
export async function getRandomDailyVideo(params: {
  apiKey: string
  categories: Array<'日常会话' | '商务英语' | '发音技巧'>
  maxDuration?: number
}): Promise<YouTubeVideo | null> {
  const { apiKey, categories, maxDuration = 900 } = params

  try {
    // 从所有类别中获取视频
    const allVideos: YouTubeVideo[] = []

    for (const category of categories) {
      const videos = await getEnglishLearningVideos({
        apiKey,
        category,
        maxDuration,
      })
      allVideos.push(...videos)
    }

    if (allVideos.length === 0) {
      return null
    }

    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * allVideos.length)
    return allVideos[randomIndex]
  } catch (error) {
    console.error('Error getting random daily video:', error)
    return null
  }
}

// 批量获取多个不重复的随机视频
export async function getRandomDailyVideos(params: {
  apiKey: string
  categories: Array<'日常会话' | '商务英语' | '发音技巧'>
  maxDuration?: number
  count: number
}): Promise<YouTubeVideo[]> {
  const { apiKey, categories, maxDuration = 900, count } = params

  try {
    console.log(`Fetching videos from YouTube for ${count} videos...`)

    // 从所有类别中获取视频
    const allVideos: YouTubeVideo[] = []

    for (const category of categories) {
      const videos = await getEnglishLearningVideos({
        apiKey,
        category,
        maxDuration,
      })
      allVideos.push(...videos)
    }

    console.log(`Total videos fetched: ${allVideos.length}`)

    if (allVideos.length === 0) {
      return []
    }

    // 去重（基于 video_id）
    const uniqueVideos = Array.from(
      new Map(allVideos.map(v => [v.id, v])).values()
    )

    console.log(`After deduplication: ${uniqueVideos.length} unique videos`)

    // 随机打乱
    const shuffled = uniqueVideos.sort(() => Math.random() - 0.5)

    // 返回前 N 个
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))
    console.log(`Returning ${selected.length} videos`)

    return selected
  } catch (error) {
    console.error('Error getting random daily videos:', error)
    return []
  }
}

// 格式化时长为可读格式
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}秒`
  }

  if (remainingSeconds === 0) {
    return `${minutes}分钟`
  }

  return `${minutes}分${remainingSeconds}秒`
}
