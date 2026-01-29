-- 简化版：视频学习数据库表

-- 1. 每日视频表
CREATE TABLE daily_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL,
  channel_title VARCHAR(255),
  published_at TIMESTAMP,
  category VARCHAR(50),
  assigned_date DATE NOT NULL UNIQUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户打卡表
CREATE TABLE user_video_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES daily_videos(id),
  watched_duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  checkin_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id, checkin_date)
);

-- 3. 用户统计表
CREATE TABLE user_video_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  total_videos_watched INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RLS策略（允许所有人访问，用于开发测试）
ALTER TABLE daily_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for daily_videos" ON daily_videos FOR ALL USING (true);
CREATE POLICY "Allow all for checkins" ON user_video_checkins FOR ALL USING (true);
CREATE POLICY "Allow all for stats" ON user_video_stats FOR ALL USING (true);
