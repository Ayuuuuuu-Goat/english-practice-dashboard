-- 检查数据状态脚本

-- 1. 检查 practice_records 表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'practice_records'
ORDER BY ordinal_position;

-- 2. 检查是否有记录
SELECT
  id,
  member_name,
  date,
  duration,
  user_id,
  created_at
FROM practice_records
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查 user_id 为 NULL 的记录
SELECT COUNT(*) as records_without_user_id
FROM practice_records
WHERE user_id IS NULL;

-- 4. 检查 gina 用户的 ID
SELECT id, email, created_at
FROM auth.users
WHERE email = 'gina@test.com';

-- 5. 检查 RLS 策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'practice_records';

-- 6. 检查发音训练数据
SELECT COUNT(*) as pronunciation_records
FROM daily_practice_stats
WHERE user_id = '85ae1820-b45d-4bd6-b4e4-08ce03251145';

-- 7. 检查视频学习数据
SELECT COUNT(*) as video_records
FROM user_video_checkins
WHERE user_id = '85ae1820-b45d-4bd6-b4e4-08ce03251145';
