-- 清空今天的视频和HN数据，让系统重新获取

-- 第1步：删除今天视频的打卡记录（先删除外键关联的数据）
DELETE FROM user_video_checkins
WHERE video_id IN (
  SELECT id FROM daily_videos WHERE assigned_date = CURRENT_DATE
);

-- 第2步：删除今天的视频
DELETE FROM daily_videos WHERE assigned_date = CURRENT_DATE;

-- 第3步：删除今天HN文章的阅读记录
DELETE FROM user_hn_readings
WHERE story_id IN (
  SELECT id FROM daily_hn_stories WHERE assigned_date = CURRENT_DATE
);

-- 第4步：删除今天的HN文章
DELETE FROM daily_hn_stories WHERE assigned_date = CURRENT_DATE;

-- 查看结果
SELECT 'Videos deleted' as action, COUNT(*) as count FROM daily_videos WHERE assigned_date = CURRENT_DATE
UNION ALL
SELECT 'HN stories deleted', COUNT(*) FROM daily_hn_stories WHERE assigned_date = CURRENT_DATE;
