-- 每日词卡发音练习功能 - 数据库Schema
-- 执行此文件以创建所有必要的表和策略

-- ============================================
-- 1. 词卡表 (Word Cards)
-- ============================================
CREATE TABLE IF NOT EXISTS word_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,                    -- 单词/短语
  phonetic TEXT,                         -- 音标
  translation TEXT,                      -- 中文释义
  example_sentence TEXT,                 -- 例句
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,                         -- 分类（如：动物、食物、日常用语）
  language TEXT NOT NULL CHECK (language IN ('en', 'zh')),
  is_preset BOOLEAN DEFAULT false,       -- 是否预设词库
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 发音练习记录表 (Pronunciation Attempts)
-- ============================================
CREATE TABLE IF NOT EXISTS pronunciation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  word_card_id UUID REFERENCES word_cards(id) ON DELETE CASCADE,
  audio_url TEXT,                        -- 录音存储URL（Vercel Blob）

  -- 科大讯飞评分结果
  total_score NUMERIC(5,2),              -- 总分 (0-100)
  accuracy_score NUMERIC(5,2),           -- 准确度
  fluency_score NUMERIC(5,2),            -- 流利度
  integrity_score NUMERIC(5,2),          -- 完整度
  phone_score NUMERIC(5,2),              -- 音素分（中文）
  tone_score NUMERIC(5,2),               -- 声调分（中文）

  raw_result JSONB,                      -- 完整API响应
  practice_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 用户设置表 (User Pronunciation Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS user_pronunciation_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily_word_count INTEGER DEFAULT 10 CHECK (daily_word_count BETWEEN 5 AND 30),
  preferred_categories TEXT[],           -- 偏好的词卡分类
  preferred_difficulty TEXT CHECK (preferred_difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  auto_advance BOOLEAN DEFAULT true,     -- 完成后自动下一个
  show_phonetic BOOLEAN DEFAULT true,    -- 是否显示音标
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 每日练习统计表 (Daily Practice Stats)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_practice_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  practice_date DATE DEFAULT CURRENT_DATE,
  target_count INTEGER NOT NULL,         -- 当日目标数量
  completed_count INTEGER DEFAULT 0,     -- 已完成数量
  avg_total_score NUMERIC(5,2),         -- 当日平均总分
  total_duration_seconds INTEGER,        -- 总练习时长
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, practice_date)
);

-- ============================================
-- 5. 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_word_cards_category ON word_cards(category);
CREATE INDEX IF NOT EXISTS idx_word_cards_difficulty ON word_cards(difficulty);
CREATE INDEX IF NOT EXISTS idx_word_cards_language ON word_cards(language);
CREATE INDEX IF NOT EXISTS idx_word_cards_is_preset ON word_cards(is_preset);
CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_user_date ON pronunciation_attempts(user_id, practice_date);
CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_word ON pronunciation_attempts(word_card_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_practice_stats(user_id, practice_date);

-- ============================================
-- 6. RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE word_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pronunciation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_practice_stats ENABLE ROW LEVEL SECURITY;

-- word_cards: 预设词库所有人可读，用户只能管理自己创建的
DROP POLICY IF EXISTS "word_cards_select" ON word_cards;
CREATE POLICY "word_cards_select" ON word_cards
  FOR SELECT USING (
    is_preset = true OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "word_cards_insert" ON word_cards;
CREATE POLICY "word_cards_insert" ON word_cards
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "word_cards_update" ON word_cards;
CREATE POLICY "word_cards_update" ON word_cards
  FOR UPDATE USING (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "word_cards_delete" ON word_cards;
CREATE POLICY "word_cards_delete" ON word_cards
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- pronunciation_attempts: 用户只能访问自己的数据
DROP POLICY IF EXISTS "pronunciation_attempts_all" ON pronunciation_attempts;
CREATE POLICY "pronunciation_attempts_all" ON pronunciation_attempts
  FOR ALL USING (user_id = auth.uid());

-- user_pronunciation_settings: 用户只能访问自己的设置
DROP POLICY IF EXISTS "user_settings_all" ON user_pronunciation_settings;
CREATE POLICY "user_settings_all" ON user_pronunciation_settings
  FOR ALL USING (user_id = auth.uid());

-- daily_practice_stats: 用户只能访问自己的统计
DROP POLICY IF EXISTS "daily_stats_all" ON daily_practice_stats;
CREATE POLICY "daily_stats_all" ON daily_practice_stats
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 7. 预设词库数据 (Preset Word Cards)
-- ============================================

-- 插入100个常用英语单词
INSERT INTO word_cards (word, phonetic, translation, difficulty, category, language, is_preset) VALUES
  -- 基础词汇 (Easy)
  ('hello', '/həˈloʊ/', '你好', 'easy', 'greetings', 'en', true),
  ('goodbye', '/ɡʊdˈbaɪ/', '再见', 'easy', 'greetings', 'en', true),
  ('thank you', '/θæŋk juː/', '谢谢', 'easy', 'greetings', 'en', true),
  ('apple', '/ˈæp.əl/', '苹果', 'easy', 'food', 'en', true),
  ('banana', '/bəˈnæn.ə/', '香蕉', 'easy', 'food', 'en', true),
  ('cat', '/kæt/', '猫', 'easy', 'animals', 'en', true),
  ('dog', '/dɔːɡ/', '狗', 'easy', 'animals', 'en', true),
  ('house', '/haʊs/', '房子', 'easy', 'places', 'en', true),
  ('school', '/skuːl/', '学校', 'easy', 'places', 'en', true),
  ('water', '/ˈwɔː.tər/', '水', 'easy', 'food', 'en', true),
  ('book', '/bʊk/', '书', 'easy', 'objects', 'en', true),
  ('pen', '/pen/', '钢笔', 'easy', 'objects', 'en', true),
  ('car', '/kɑːr/', '汽车', 'easy', 'transportation', 'en', true),
  ('bus', '/bʌs/', '公交车', 'easy', 'transportation', 'en', true),
  ('red', '/red/', '红色', 'easy', 'colors', 'en', true),
  ('blue', '/bluː/', '蓝色', 'easy', 'colors', 'en', true),
  ('green', '/ɡriːn/', '绿色', 'easy', 'colors', 'en', true),
  ('one', '/wʌn/', '一', 'easy', 'numbers', 'en', true),
  ('two', '/tuː/', '二', 'easy', 'numbers', 'en', true),
  ('three', '/θriː/', '三', 'easy', 'numbers', 'en', true),

  -- 中级词汇 (Medium)
  ('beautiful', '/ˈbjuː.tɪ.fəl/', '美丽的', 'medium', 'adjectives', 'en', true),
  ('interesting', '/ˈɪn.trə.stɪŋ/', '有趣的', 'medium', 'adjectives', 'en', true),
  ('delicious', '/dɪˈlɪʃ.əs/', '美味的', 'medium', 'adjectives', 'en', true),
  ('restaurant', '/ˈres.tər.ɑːnt/', '餐厅', 'medium', 'places', 'en', true),
  ('hospital', '/ˈhɑː.spɪ.təl/', '医院', 'medium', 'places', 'en', true),
  ('university', '/ˌjuː.nɪˈvɜːr.sə.ti/', '大学', 'medium', 'places', 'en', true),
  ('computer', '/kəmˈpjuː.tər/', '电脑', 'medium', 'technology', 'en', true),
  ('telephone', '/ˈtel.ɪ.foʊn/', '电话', 'medium', 'technology', 'en', true),
  ('television', '/ˈtel.ɪ.vɪʒ.ən/', '电视', 'medium', 'technology', 'en', true),
  ('exercise', '/ˈek.sər.saɪz/', '锻炼', 'medium', 'activities', 'en', true),
  ('breakfast', '/ˈbrek.fəst/', '早餐', 'medium', 'food', 'en', true),
  ('lunch', '/lʌntʃ/', '午餐', 'medium', 'food', 'en', true),
  ('dinner', '/ˈdɪn.ər/', '晚餐', 'medium', 'food', 'en', true),
  ('coffee', '/ˈkɑː.fi/', '咖啡', 'medium', 'food', 'en', true),
  ('weather', '/ˈweð.ər/', '天气', 'medium', 'nature', 'en', true),
  ('mountain', '/ˈmaʊn.tən/', '山', 'medium', 'nature', 'en', true),
  ('ocean', '/ˈoʊ.ʃən/', '海洋', 'medium', 'nature', 'en', true),
  ('summer', '/ˈsʌm.ər/', '夏天', 'medium', 'seasons', 'en', true),
  ('winter', '/ˈwɪn.tər/', '冬天', 'medium', 'seasons', 'en', true),
  ('spring', '/sprɪŋ/', '春天', 'medium', 'seasons', 'en', true),

  -- 高级词汇 (Hard)
  ('extraordinary', '/ɪkˈstrɔːr.dən.er.i/', '非凡的', 'hard', 'adjectives', 'en', true),
  ('sophisticated', '/səˈfɪs.tɪ.keɪ.tɪd/', '复杂的;老练的', 'hard', 'adjectives', 'en', true),
  ('pharmaceutical', '/ˌfɑːr.məˈsuː.tɪ.kəl/', '药物的', 'hard', 'medical', 'en', true),
  ('architecture', '/ˈɑːr.kɪ.tek.tʃər/', '建筑学', 'hard', 'professions', 'en', true),
  ('psychology', '/saɪˈkɑː.lə.dʒi/', '心理学', 'hard', 'science', 'en', true),
  ('entrepreneurship', '/ˌɑːn.trə.prəˈnɜːr.ʃɪp/', '创业精神', 'hard', 'business', 'en', true),
  ('infrastructure', '/ˈɪn.frəˌstrʌk.tʃər/', '基础设施', 'hard', 'general', 'en', true),
  ('consciousness', '/ˈkɑːn.ʃəs.nəs/', '意识', 'hard', 'philosophy', 'en', true),
  ('sustainability', '/səˌsteɪ.nəˈbɪl.ə.ti/', '可持续性', 'hard', 'environment', 'en', true),
  ('accommodation', '/əˌkɑː.məˈdeɪ.ʃən/', '住宿', 'hard', 'travel', 'en', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_word_cards_updated_at ON word_cards;
CREATE TRIGGER update_word_cards_updated_at
    BEFORE UPDATE ON word_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_pronunciation_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_pronunciation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！
-- ============================================
-- 执行此文件后，请验证：
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE '%pronunciation%' OR table_name = 'word_cards';
