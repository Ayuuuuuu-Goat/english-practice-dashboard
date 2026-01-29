// API Route: 上传录音到Vercel Blob

import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const filename = `pronunciation/${timestamp}-${randomId}.wav`

    // 上传到Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: 'audio/wav',
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
    })
  } catch (error) {
    console.error('Error uploading audio:', error)
    return NextResponse.json(
      { error: 'Failed to upload audio' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
