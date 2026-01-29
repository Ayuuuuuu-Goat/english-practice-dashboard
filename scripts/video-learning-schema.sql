-- 视频学习功能数据库架构

-- 每日视频表
CREATE TABLE IF NOT EXISTS daily_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(20) NOT NULL, -- YouTube视频ID
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL, -- 时长（秒）
  channel_title VARCHAR(255),
  published_at TIMESTAMP,
  category VARCHAR(50), -- 日常会话/商务英语/发音技巧
  assigned_date DATE NOT NULL UNIQUE, -- 每日唯一
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户视频打卡记录表
CREATE TABLE IF NOT EXISTS user_video_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES daily_videos(id),
  watched_duration INTEGER DEFAULT 0, -- 观看时长（秒）
  completed BOOLEAN DEFAULT FALSE, -- 是否完成观看
  notes TEXT, -- 用户笔记
  checkin_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id, checkin_date)
);

-- 视频学习统计表
CREATE TABLE IF NOT EXISTS user_video_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  total_videos_watched INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- 总观看时长（秒）
  current_streak INTEGER DEFAULT 0, -- 当前连续打卡天数
  longest_streak INTEGER DEFAULT 0, -- 最长连续打卡天数
  last_checkin_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_videos_date ON daily_videos(assigned_date);
CREATE INDEX IF NOT EXISTS idx_user_video_checkins_user_date ON user_video_checkins(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_user_video_checkins_video ON user_video_checkins(video_id);

-- RLS策略
ALTER TABLE daily_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_stats ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看每日视频
CREATE POLICY "Anyone can view daily videos"
  ON daily_videos FOR SELECT
  USING (true);

-- 用户只能查看和创建自己的打卡记录
CREATE POLICY "Users can view own checkins"
  ON user_video_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkins"
  ON user_video_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON user_video_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能查看和更新自己的统计
CREATE POLICY "Users can view own stats"
  ON user_video_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_video_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_video_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_videos_updated_at BEFORE UPDATE ON daily_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_video_checkins_updated_at BEFORE UPDATE ON user_video_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_video_stats_updated_at BEFORE UPDATE ON user_video_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
