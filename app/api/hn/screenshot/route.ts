import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 最长60秒

// POST: 截取网页截图
export async function POST(request: NextRequest) {
  let browser = null

  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    console.log(`开始截图: ${url}`)

    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    // 设置视口大小
    await page.setViewport({
      width: 1280,
      height: 1024,
      deviceScaleFactor: 1,
    })

    // 设置超时和用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 访问页面
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // 等待一下确保页面渲染完成
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 截取整页截图
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    })

    await browser.close()

    console.log(`截图成功: ${url}`)

    // 返回图片
    return new NextResponse(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // 缓存1天
      },
    })
  } catch (error: any) {
    console.error('截图失败:', error)

    if (browser) {
      await browser.close()
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Screenshot failed',
      },
      { status: 500 }
    )
  }
}
