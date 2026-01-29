// HN 外链文章内容抓取模块
import * as cheerio from 'cheerio'
import axios from 'axios'

// 抓取配置
const SCRAPER_CONFIG = {
  timeout: 10000, // 10秒超时
  maxContentSize: 5 * 1024 * 1024, // 5MB最大内容
  retryAttempts: 2, // 失败重试2次
  retryDelay: 1000, // 重试间隔1秒
  headers: {
    'User-Agent': 'HN-AI-Reader/1.0 (Educational Purpose)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
  },
}

// 域名黑名单（已知无法抓取的网站）
const DOMAIN_BLACKLIST = new Set([
  // 可根据实际情况添加
])

// 抓取结果类型
export interface ScraperResult {
  success: boolean
  content?: string
  images?: Array<{ url: string; alt: string }>
  error?: string
}

// 图片信息类型
interface ImageInfo {
  url: string
  alt: string
}

/**
 * 检查是否应跳过抓取
 */
function shouldSkipScraping(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return DOMAIN_BLACKLIST.has(hostname)
  } catch {
    return false
  }
}

/**
 * 检测付费墙
 */
function detectPaywall(html: string, $: cheerio.CheerioAPI): boolean {
  const paywallIndicators = [
    // 文本特征
    'subscribe to read',
    'members only',
    'sign in to continue',
    'this content is for subscribers',
    'subscribe to unlock',
    'premium content',
    'paid subscribers',

    // 类名特征
    '.paywall',
    '.subscription-required',
    '#paywall-banner',
  ]

  const lowerHtml = html.toLowerCase()

  // 检查文本特征
  for (const indicator of paywallIndicators) {
    if (indicator.startsWith('.') || indicator.startsWith('#')) {
      // 检查CSS选择器
      if ($(indicator).length > 0) {
        return true
      }
    } else {
      // 检查文本内容
      if (lowerHtml.includes(indicator.toLowerCase())) {
        return true
      }
    }
  }

  return false
}

/**
 * 提取图片信息
 */
function extractImages($: cheerio.CheerioAPI, baseUrl: string): ImageInfo[] {
  const images: ImageInfo[] = []
  const seenUrls = new Set<string>()

  $('img').each((_, elem) => {
    const $img = $(elem)
    let imgUrl = $img.attr('src') || $img.attr('data-src')

    if (!imgUrl) return

    try {
      // 相对路径转绝对路径
      const absoluteUrl = new URL(imgUrl, baseUrl).href

      // 去重
      if (seenUrls.has(absoluteUrl)) return
      seenUrls.add(absoluteUrl)

      // 过滤跟踪像素和小图标
      if (absoluteUrl.includes('1x1') || absoluteUrl.includes('tracking')) {
        return
      }

      images.push({
        url: absoluteUrl,
        alt: $img.attr('alt') || '',
      })
    } catch (error) {
      console.error('Error processing image URL:', imgUrl, error)
    }
  })

  return images
}

/**
 * 提取文章主体内容
 */
function extractMainContent($: cheerio.CheerioAPI, baseUrl: string): string {
  // 策略1: 使用语义化标签
  let $content = $('article').first()

  if (!$content.length) {
    $content = $('main').first()
  }

  // 策略2: 使用常见的内容类名
  if (!$content.length) {
    const contentSelectors = [
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '.post-body',
      '.article-body',
      '[role="main"]',
    ]

    for (const selector of contentSelectors) {
      $content = $(selector).first()
      if ($content.length && $content.text().trim().length > 500) {
        break
      }
    }
  }

  // 策略3: 找最大文本密度区块
  if (!$content.length || $content.text().trim().length < 500) {
    let maxLength = 0
    let $bestMatch = $('body')

    $('div, section').each((_, elem) => {
      const $elem = $(elem)
      const text = $elem.text().trim()
      if (text.length > maxLength) {
        maxLength = text.length
        $bestMatch = $elem
      }
    })

    $content = $bestMatch
  }

  // 清理内容
  return cleanHTML($, $content, baseUrl)
}

/**
 * 清理 HTML 内容
 */
function cleanHTML($: cheerio.CheerioAPI, $content: cheerio.Cheerio<any>, baseUrl: string): string {
  // 移除不需要的元素
  const removeSelectors = [
    'script',
    'style',
    'iframe:not([src*="youtube"]):not([src*="vimeo"])', // 保留视频嵌入
    'nav',
    'header',
    'footer',
    'aside',
    '.advertisement',
    '.ad',
    '.ads',
    '.promo',
    '.social-share',
    '.share-buttons',
    '.comment',
    '.comments',
    '.related-posts',
    '.newsletter-signup',
    '[class*="sidebar"]',
    '[class*="cookie"]',
    '[id*="cookie"]',
  ]

  removeSelectors.forEach(selector => {
    $content.find(selector).remove()
  })

  // 处理链接（转换为绝对URL）
  $content.find('a').each((_, elem) => {
    const $link = $(elem)
    const href = $link.attr('href')
    if (href) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href
        $link.attr('href', absoluteUrl)
      } catch {
        // 忽略无效链接
      }
    }
  })

  // 处理图片URL
  $content.find('img').each((_, elem) => {
    const $img = $(elem)
    const src = $img.attr('src')
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href
        $img.attr('src', absoluteUrl)
      } catch {
        // 忽略无效图片
      }
    }
  })

  // 移除空段落和过短的段落
  $content.find('p').each((_, elem) => {
    const $p = $(elem)
    const text = $p.text().trim()
    if (text.length < 30) {
      $p.remove()
    }
  })

  return $content.html() || ''
}

/**
 * 主抓取函数
 */
export async function scrapeArticle(
  url: string,
  options?: { timeout?: number; maxRetries?: number }
): Promise<ScraperResult> {
  const timeout = options?.timeout || SCRAPER_CONFIG.timeout
  const maxRetries = options?.maxRetries || SCRAPER_CONFIG.retryAttempts

  // 检查黑名单
  if (shouldSkipScraping(url)) {
    return {
      success: false,
      error: 'Domain is in blacklist',
    }
  }

  let lastError: any = null

  // 重试逻辑
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 发起请求
      const response = await axios.get(url, {
        timeout,
        maxContentLength: SCRAPER_CONFIG.maxContentSize,
        headers: SCRAPER_CONFIG.headers,
        validateStatus: (status) => status === 200,
      })

      const html = response.data
      const $ = cheerio.load(html)

      // 检测付费墙
      if (detectPaywall(html, $)) {
        return {
          success: false,
          error: 'Paywall detected',
        }
      }

      // 提取主体内容
      const content = extractMainContent($, url)

      // 验证内容长度
      const textContent = $.text(content)
      if (textContent.trim().length < 500) {
        return {
          success: false,
          error: 'Content too short (possible extraction failure)',
        }
      }

      // 提取图片
      const images = extractImages($, url)

      return {
        success: true,
        content,
        images,
      }
    } catch (error: any) {
      lastError = error

      // 某些错误不需要重试
      if (error.code === 'ENOTFOUND' || error.response?.status === 404) {
        return {
          success: false,
          error: `Failed to fetch: ${error.message}`,
        }
      }

      // 如果还有重试次数，等待后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.retryDelay))
        continue
      }
    }
  }

  // 所有重试都失败
  return {
    success: false,
    error: lastError ? `Scraping failed after ${maxRetries + 1} attempts: ${lastError.message}` : 'Unknown error',
  }
}

/**
 * 批量抓取文章（带并发控制）
 */
export async function scrapeArticles(
  urls: string[],
  options?: { timeout?: number; maxRetries?: number; concurrency?: number }
): Promise<Map<string, ScraperResult>> {
  const concurrency = options?.concurrency || 5
  const results = new Map<string, ScraperResult>()

  // 分批处理
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async url => {
        const result = await scrapeArticle(url, options)
        return { url, result }
      })
    )

    batchResults.forEach(({ url, result }) => {
      results.set(url, result)
    })
  }

  return results
}
