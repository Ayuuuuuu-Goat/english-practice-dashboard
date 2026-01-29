-- Hacker News 英语阅读数据库表

-- 1. 每日 HN 文章表
CREATE TABLE IF NOT EXISTS daily_hn_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hn_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT,
  text TEXT,
  score INTEGER DEFAULT 0,
  descendants INTEGER DEFAULT 0,
  author VARCHAR(255),
  posted_at TIMESTAMP NOT NULL,
  assigned_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户阅读记录表
CREATE TABLE IF NOT EXISTS user_hn_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES daily_hn_stories(id),
  read_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  reading_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, story_id, reading_date)
);

-- 3. 用户阅读统计表
CREATE TABLE IF NOT EXISTS user_hn_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  total_stories_read INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_hn_stories_assigned_date ON daily_hn_stories(assigned_date);
CREATE INDEX IF NOT EXISTS idx_user_hn_readings_user_id ON user_hn_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hn_readings_reading_date ON user_hn_readings(reading_date);

-- 5. RLS 策略（允许所有人访问，用于开发测试）
ALTER TABLE daily_hn_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hn_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hn_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for daily_hn_stories" ON daily_hn_stories FOR ALL USING (true);
CREATE POLICY "Allow all for hn_readings" ON user_hn_readings FOR ALL USING (true);
CREATE POLICY "Allow all for hn_stats" ON user_hn_stats FOR ALL USING (true);
