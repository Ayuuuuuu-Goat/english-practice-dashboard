-- =====================================================
-- 为存在的表添加RLS策略
-- 允许所有用户读取数据
-- =====================================================

-- 1. 行业报告表
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to industry_reports"
ON industry_reports FOR SELECT TO anon, authenticated USING (true);

-- 2. 行业报告词汇表
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to report_vocabulary"
ON report_vocabulary FOR SELECT TO anon, authenticated USING (true);

-- 3. 行业报告讨论问题
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to report_discussion_questions"
ON report_discussion_questions FOR SELECT TO anon, authenticated USING (true);

-- 4. 技术播客
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to tech_podcasts"
ON tech_podcasts FOR SELECT TO anon, authenticated USING (true);

-- 5. 播客词汇
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to podcast_vocabulary"
ON podcast_vocabulary FOR SELECT TO anon, authenticated USING (true);
