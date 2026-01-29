-- 删除 daily_videos 表的 assigned_date UNIQUE 约束，以支持每天多个视频

-- 查找约束名称
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'daily_videos'
AND constraint_type = 'UNIQUE';

-- 删除约束（替换为实际的约束名称）
ALTER TABLE daily_videos
DROP CONSTRAINT IF EXISTS daily_videos_assigned_date_key;

-- 验证：现在应该可以插入同一天的多个视频
-- SELECT * FROM daily_videos WHERE assigned_date = CURRENT_DATE;
