-- =====================================================
-- 为行业报告和播客表添加RLS策略
-- 允许所有用户读取数据
-- =====================================================

-- 1. 行业报告表：允许所有人读取
CREATE POLICY "Allow anonymous read access to industry_reports"
ON industry_reports
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. 行业报告词汇表：允许所有人读取
CREATE POLICY "Allow anonymous read access to report_vocabulary"
ON report_vocabulary
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. 行业报告讨论问题：允许所有人读取
CREATE POLICY "Allow anonymous read access to report_discussion_questions"
ON report_discussion_questions
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. 技术播客：允许所有人读取
CREATE POLICY "Allow anonymous read access to tech_podcasts"
ON tech_podcasts
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. 播客片段：允许所有人读取
CREATE POLICY "Allow anonymous read access to podcast_segments"
ON podcast_segments
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. 播客词汇：允许所有人读取
CREATE POLICY "Allow anonymous read access to podcast_vocabulary"
ON podcast_vocabulary
FOR SELECT
TO anon, authenticated
USING (true);

-- 验证RLS状态
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN (
  'industry_reports',
  'report_vocabulary',
  'report_discussion_questions',
  'tech_podcasts',
  'podcast_segments',
  'podcast_vocabulary'
);

-- 查看所有策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command"
FROM pg_policies
WHERE tablename IN (
  'industry_reports',
  'report_vocabulary',
  'report_discussion_questions',
  'tech_podcasts',
  'podcast_segments',
  'podcast_vocabulary'
)
ORDER BY tablename, policyname;
