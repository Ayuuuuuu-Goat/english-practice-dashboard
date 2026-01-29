-- HN 文章抓取功能数据库扩展
-- 执行日期: 2026-01-27

-- 扩展 daily_hn_stories 表，添加抓取相关字段
ALTER TABLE daily_hn_stories
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS content_source VARCHAR(20) DEFAULT 'hn_text',
ADD COLUMN IF NOT EXISTS scraped_content TEXT,
ADD COLUMN IF NOT EXISTS scraped_images JSONB,
ADD COLUMN IF NOT EXISTS scrape_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS scrape_error TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP;

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_daily_hn_stories_content_source
ON daily_hn_stories(content_source);

CREATE INDEX IF NOT EXISTS idx_daily_hn_stories_scrape_status
ON daily_hn_stories(scrape_status);

-- 字段说明：
-- original_url: 存储外链URL（从HN的url字段）
-- scraped_content: 抓取的文章HTML内容（清理后）
-- content_source: 内容来源类型
--   - 'hn_text': 使用HN原帖text字段
--   - 'scraped': 使用抓取的外链内容
--   - 'link_only': 仅有链接，无法抓取
-- scraped_images: 图片信息JSON数组 [{"url":"...", "alt":"..."}]
-- scrape_status: 抓取状态
--   - 'success': 抓取成功
--   - 'failed': 抓取失败
--   - 'no_external': 无外链
-- scrape_error: 抓取失败原因
-- scraped_at: 抓取时间戳
