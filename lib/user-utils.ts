import { createHash } from 'crypto'

/**
 * 为email生成一个固定的UUID v5
 * 使用email的哈希值生成，确保相同的email总是得到相同的UUID
 */
export function emailToUUID(email: string): string {
  // 使用MD5哈希email（MD5够用了，这里只是为了生成固定的UUID）
  const hash = createHash('md5').update(email.toLowerCase()).digest('hex')

  // 格式化为UUID格式: xxxxxxxx-xxxx-5xxx-xxxx-xxxxxxxxxxxx
  // 这里使用version 5的格式（基于名称的UUID）
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),  // version 5
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-')
}

/**
 * 验证是否为有效的UUID格式
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
