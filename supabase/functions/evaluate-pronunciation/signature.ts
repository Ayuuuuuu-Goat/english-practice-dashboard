// 科大讯飞 API 签名生成

/**
 * 生成 HMAC-SHA256 签名用于 WebSocket 认证
 */
export async function generateSignature(params: {
  apiKey: string
  apiSecret: string
  host: string
  date: string
  requestLine: string
}): Promise<string> {
  const { apiKey, apiSecret, host, date, requestLine } = params

  // 构建签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`

  // 使用 HMAC-SHA256 生成签名
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const messageData = encoder.encode(signatureOrigin)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  // 转换为 Base64
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return signatureBase64
}

/**
 * 生成完整的授权URL
 */
export async function generateAuthUrl(params: {
  appId: string
  apiKey: string
  apiSecret: string
  baseUrl: string
  requestLine: string
}): Promise<string> {
  const { appId, apiKey, apiSecret, baseUrl, requestLine } = params

  // 生成RFC1123格式的日期
  const date = new Date().toUTCString()

  // 从URL中提取host
  const url = new URL(baseUrl)
  const host = url.host

  // 生成签名
  const signature = await generateSignature({
    apiKey,
    apiSecret,
    host,
    date,
    requestLine,
  })

  // 构建authorization字符串
  const authorization = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorizationBase64 = btoa(authorization)

  // 构建完整URL
  url.searchParams.set('authorization', authorizationBase64)
  url.searchParams.set('date', date)
  url.searchParams.set('host', host)

  return url.toString()
}
