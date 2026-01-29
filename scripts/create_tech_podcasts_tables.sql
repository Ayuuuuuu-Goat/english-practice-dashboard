-- 技术播客主表
CREATE TABLE IF NOT EXISTS tech_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT, -- 演讲者
  source TEXT NOT NULL, -- 'TED', 'Podcast', 'Tech Talk'
  category TEXT NOT NULL, -- 'ai', 'startup', 'design', 'leadership'
  audio_url TEXT NOT NULL, -- 音频URL
  video_url TEXT, -- 视频URL（可选）
  thumbnail_url TEXT, -- 缩略图
  transcript TEXT NOT NULL, -- 完整文本
  duration_seconds INTEGER NOT NULL, -- 时长（秒）
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  description TEXT, -- 简介
  published_at TIMESTAMPTZ, -- 发布日期
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 播客生词表
CREATE TABLE IF NOT EXISTS podcast_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES tech_podcasts(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  definition_en TEXT NOT NULL,
  definition_cn TEXT NOT NULL,
  context TEXT, -- 在播客中的上下文
  timestamp_seconds INTEGER, -- 出现的时间点
  difficulty TEXT DEFAULT 'medium',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 听写片段表
CREATE TABLE IF NOT EXISTS podcast_dictation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES tech_podcasts(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL, -- 开始时间（秒）
  end_time INTEGER NOT NULL, -- 结束时间（秒）
  text TEXT NOT NULL, -- 正确文本
  difficulty TEXT DEFAULT 'medium',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户播客进度表
CREATE TABLE IF NOT EXISTS user_podcast_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  podcast_id UUID REFERENCES tech_podcasts(id) ON DELETE CASCADE,
  current_position INTEGER DEFAULT 0, -- 当前播放位置（秒）
  vocabulary_learned INTEGER DEFAULT 0, -- 已学词汇数
  dictation_completed INTEGER DEFAULT 0, -- 已完成听写数
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, podcast_id)
);

-- 用户听写记录表
CREATE TABLE IF NOT EXISTS user_dictation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  podcast_id UUID REFERENCES tech_podcasts(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES podcast_dictation_segments(id) ON DELETE CASCADE,
  user_text TEXT NOT NULL, -- 用户输入的文本
  correct_text TEXT NOT NULL, -- 正确文本
  accuracy_score INTEGER, -- 准确度 0-100
  wpm INTEGER, -- 每分钟单词数
  errors JSONB, -- 错误详情
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, segment_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tech_podcasts_category ON tech_podcasts(category);
CREATE INDEX IF NOT EXISTS idx_tech_podcasts_featured ON tech_podcasts(is_featured);
CREATE INDEX IF NOT EXISTS idx_podcast_vocabulary_podcast ON podcast_vocabulary(podcast_id);
CREATE INDEX IF NOT EXISTS idx_podcast_dictation_podcast ON podcast_dictation_segments(podcast_id);
CREATE INDEX IF NOT EXISTS idx_user_podcast_progress_user ON user_podcast_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dictation_user ON user_dictation_attempts(user_id);

-- 启用 RLS
ALTER TABLE tech_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_dictation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dictation_attempts ENABLE ROW LEVEL SECURITY;

-- RLS 策略：播客、词汇、听写片段对所有认证用户可读
CREATE POLICY "Podcasts are viewable by authenticated users"
  ON tech_podcasts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Podcast vocabulary is viewable by authenticated users"
  ON podcast_vocabulary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Dictation segments are viewable by authenticated users"
  ON podcast_dictation_segments FOR SELECT
  TO authenticated
  USING (true);

-- RLS 策略：用户只能看到自己的进度
CREATE POLICY "Users can view own podcast progress"
  ON user_podcast_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own podcast progress"
  ON user_podcast_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own podcast progress"
  ON user_podcast_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能看到自己的听写记录
CREATE POLICY "Users can view own dictation attempts"
  ON user_dictation_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dictation attempts"
  ON user_dictation_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dictation attempts"
  ON user_dictation_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 插入示例数据
INSERT INTO tech_podcasts (
  title,
  speaker,
  source,
  category,
  audio_url,
  transcript,
  duration_seconds,
  difficulty,
  description,
  published_at,
  is_featured
) VALUES (
  'The Future of AI: Opportunities and Challenges',
  'Dr. Sarah Chen',
  'TED',
  'ai',
  'https://example.com/podcast-ai-future.mp3',
  'Good morning everyone. Today I want to talk about the future of artificial intelligence and what it means for all of us.

Artificial intelligence has evolved dramatically over the past decade. We''ve moved from simple rule-based systems to sophisticated neural networks that can understand language, recognize images, and even create art.

But with great power comes great responsibility. As AI systems become more capable, we need to think carefully about three key areas: ethics, safety, and accessibility.

First, ethics. AI systems learn from data, and if that data contains biases, the AI will perpetuate those biases. We''ve seen this in hiring algorithms that discriminate against women, facial recognition systems that perform poorly on people of color, and credit scoring models that disadvantage certain communities.

Second, safety. As AI systems become more autonomous, we need robust frameworks to ensure they behave as intended. The alignment problem - making sure AI systems understand and follow human values - is one of the most critical challenges we face.

Third, accessibility. Right now, the most powerful AI systems are concentrated in the hands of a few large tech companies. We need to democratize access to AI tools and education so that everyone can benefit from this technology, not just the privileged few.

So what can we do? As technologists, we must build AI systems with ethics and safety in mind from the start, not as an afterthought. As educators, we need to prepare the next generation for an AI-driven world. And as citizens, we must advocate for policies that ensure AI benefits all of humanity.

The future of AI is not predetermined. It will be shaped by the choices we make today. Let''s make sure we choose wisely. Thank you.',
  420,
  'medium',
  'A thought-provoking discussion on the opportunities and challenges presented by artificial intelligence, covering ethics, safety, and accessibility.',
  '2024-01-10'::timestamptz,
  true
);

-- 获取刚插入的播客ID
DO $$
DECLARE
  podcast_uuid UUID;
BEGIN
  SELECT id INTO podcast_uuid FROM tech_podcasts WHERE title = 'The Future of AI: Opportunities and Challenges';

  -- 插入生词
  INSERT INTO podcast_vocabulary (podcast_id, word, phonetic, definition_en, definition_cn, context, timestamp_seconds, difficulty, order_index) VALUES
  (podcast_uuid, 'sophisticated', '/səˈfɪstɪkeɪtɪd/', 'Highly developed, complex, or refined', '复杂的；精密的；老练的', 'sophisticated neural networks that can understand language', 45, 'medium', 1),
  (podcast_uuid, 'perpetuate', '/pərˈpetʃueɪt/', 'Make something continue indefinitely', '使永久化；使持续', 'the AI will perpetuate those biases', 95, 'hard', 2),
  (podcast_uuid, 'autonomous', '/ɔːˈtɒnəməs/', 'Having the freedom to act independently', '自主的；自治的', 'As AI systems become more autonomous', 145, 'medium', 3),
  (podcast_uuid, 'alignment', '/əˈlaɪnmənt/', 'Arrangement in a straight line or proper position', '对齐；校准；（价值观）对齐', 'The alignment problem - making sure AI systems understand human values', 160, 'hard', 4),
  (podcast_uuid, 'democratize', '/dɪˈmɒkrətaɪz/', 'Make something accessible to everyone', '使民主化；普及', 'We need to democratize access to AI tools', 210, 'medium', 5),
  (podcast_uuid, 'advocate', '/ˈædvəkeɪt/', 'Publicly support or recommend', '提倡；拥护', 'we must advocate for policies that ensure AI benefits all', 290, 'medium', 6),
  (podcast_uuid, 'predetermined', '/ˌpriːdɪˈtɜːmɪnd/', 'Decided or established in advance', '预先确定的', 'The future of AI is not predetermined', 360, 'medium', 7);

  -- 插入听写片段
  INSERT INTO podcast_dictation_segments (podcast_id, start_time, end_time, text, difficulty, order_index) VALUES
  (podcast_uuid, 25, 45, 'Artificial intelligence has evolved dramatically over the past decade.', 'easy', 1),
  (podcast_uuid, 85, 115, 'If that data contains biases, the AI will perpetuate those biases.', 'medium', 2),
  (podcast_uuid, 150, 175, 'The alignment problem is one of the most critical challenges we face.', 'hard', 3),
  (podcast_uuid, 200, 225, 'We need to democratize access to AI tools and education.', 'medium', 4),
  (podcast_uuid, 350, 370, 'The future of AI will be shaped by the choices we make today.', 'easy', 5);
END $$;
