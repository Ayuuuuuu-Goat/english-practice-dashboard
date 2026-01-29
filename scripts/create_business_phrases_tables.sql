-- =====================================================
-- 每日商务短语功能
-- =====================================================

-- 1. 商务短语表
CREATE TABLE IF NOT EXISTS business_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_en TEXT NOT NULL,
  phrase_cn TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('meeting', 'email', 'negotiation', 'social')),
  example_sentence TEXT NOT NULL,
  example_translation TEXT,
  usage_notes TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 短语打卡记录表
CREATE TABLE IF NOT EXISTS phrase_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL,
  phrases_learned JSONB NOT NULL DEFAULT '[]',
  total_phrases INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_business_phrases_category ON business_phrases(category);
CREATE INDEX IF NOT EXISTS idx_business_phrases_difficulty ON business_phrases(difficulty);
CREATE INDEX IF NOT EXISTS idx_business_phrases_active ON business_phrases(is_active);
CREATE INDEX IF NOT EXISTS idx_phrase_checkins_user_date ON phrase_checkins(user_id, checkin_date);

-- 插入示例数据
INSERT INTO business_phrases (phrase_en, phrase_cn, category, example_sentence, example_translation, difficulty, order_index) VALUES
-- 会议场景
('Let''s circle back on this', '我们稍后再讨论这个', 'meeting', 'Let''s circle back on this topic after lunch.', '我们午饭后再回过头来讨论这个话题。', 'easy', 1),
('I''ll loop you in', '我会把你加入讨论', 'meeting', 'I''ll loop you in on the email thread about the project.', '我会把你加入关于这个项目的邮件讨论中。', 'easy', 2),
('Let''s take this offline', '我们私下讨论', 'meeting', 'This is getting complicated. Let''s take this offline.', '这变得复杂了。我们私下讨论吧。', 'easy', 3),
('Let''s touch base', '我们保持联系/简短沟通', 'meeting', 'Let''s touch base next week to see how things are progressing.', '我们下周联系一下，看看进展如何。', 'easy', 4),
('Let''s table this discussion', '我们暂时搁置这个讨论', 'meeting', 'We''re running out of time. Let''s table this discussion for now.', '我们时间不够了。我们暂时搁置这个讨论吧。', 'medium', 5),

-- 邮件场景
('Just wanted to follow up', '想跟进一下', 'email', 'Just wanted to follow up on my previous email about the proposal.', '想跟进一下我之前关于提案的邮件。', 'easy', 6),
('Per our conversation', '根据我们的对话', 'email', 'Per our conversation yesterday, I''m attaching the updated report.', '根据我们昨天的对话，我附上了更新的报告。', 'medium', 7),
('FYI (For Your Information)', '供您参考', 'email', 'FYI, the meeting has been moved to 3 PM.', '供您参考，会议已改到下午3点。', 'easy', 8),
('Please let me know at your earliest convenience', '请在方便时尽快告知', 'email', 'Please let me know at your earliest convenience if you can attend.', '如果您能参加，请尽快告知。', 'medium', 9),
('I''ll get back to you on this', '我会就此事回复您', 'email', 'I need to check with my team. I''ll get back to you on this by Friday.', '我需要和团队确认。我会在周五前就此事回复您。', 'easy', 10),

-- 谈判场景
('Let''s find a win-win solution', '让我们找到双赢的解决方案', 'negotiation', 'I believe we can find a win-win solution that benefits both parties.', '我相信我们能找到让双方都受益的双赢方案。', 'medium', 11),
('What''s your bottom line?', '你的底线是什么？', 'negotiation', 'Before we proceed, what''s your bottom line on the pricing?', '在我们继续之前，你在价格上的底线是什么？', 'medium', 12),
('Let''s meet halfway', '我们各让一步', 'negotiation', 'I understand your concerns. Let''s meet halfway on this issue.', '我理解你的顾虑。我们在这个问题上各让一步吧。', 'easy', 13),
('Can you sweeten the deal?', '你能提供更好的条件吗？', 'negotiation', 'The offer is good, but can you sweeten the deal with faster delivery?', '这个报价不错，但你能通过更快的交付来提供更好的条件吗？', 'hard', 14),
('Let''s hammer out the details', '让我们敲定细节', 'negotiation', 'We agree on the main terms. Let''s hammer out the details tomorrow.', '我们在主要条款上达成一致了。明天我们来敲定细节。', 'medium', 15),

-- 社交场景
('Let''s grab coffee sometime', '我们找时间喝杯咖啡吧', 'social', 'It was great meeting you. Let''s grab coffee sometime next week.', '很高兴认识你。我们下周找时间喝杯咖啡吧。', 'easy', 16),
('I''d love to pick your brain', '我想向您请教', 'social', 'I''d love to pick your brain about your experience in this industry.', '我想向您请教一下您在这个行业的经验。', 'medium', 17),
('Let''s keep in touch', '让我们保持联系', 'social', 'Thanks for the insightful conversation. Let''s keep in touch!', '感谢这次有见地的对话。让我们保持联系！', 'easy', 18),
('Small world!', '世界真小！', 'social', 'You know Sarah too? Small world!', '你也认识Sarah？世界真小！', 'easy', 19),
('Let me introduce you to...', '让我介绍你认识...', 'social', 'Let me introduce you to our team lead, she''s been with the company for 10 years.', '让我介绍你认识我们的团队负责人，她在公司已经10年了。', 'easy', 20);

-- 添加RLS策略（如果需要）
ALTER TABLE business_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_checkins ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取短语
CREATE POLICY "Allow read access to business_phrases"
ON business_phrases FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 允许用户读写自己的打卡记录
CREATE POLICY "Allow users to read own checkins"
ON phrase_checkins FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow users to insert own checkins"
ON phrase_checkins FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update own checkins"
ON phrase_checkins FOR UPDATE
TO anon, authenticated
USING (true);
