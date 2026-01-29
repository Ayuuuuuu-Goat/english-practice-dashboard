-- AI 场景对话功能数据库 Schema

-- ============================================
-- 1. 对话场景表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_conversation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                       -- 场景名称（如：技术面试）
  name_en TEXT NOT NULL,                    -- 英文名称
  category TEXT NOT NULL,                   -- 分类（interview, meeting, report, negotiation）
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  icon TEXT,                                -- 图标 emoji
  description TEXT,                         -- 场景描述
  system_prompt TEXT NOT NULL,              -- AI 角色设定
  initial_message TEXT NOT NULL,            -- 开场白
  tips TEXT[],                              -- 场景提示
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 用户对话会话表
-- ============================================
CREATE TABLE IF NOT EXISTS user_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  scenario_id UUID REFERENCES ai_conversation_scenarios(id),
  status TEXT CHECK (status IN ('ongoing', 'completed', 'abandoned')) DEFAULT 'ongoing',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  average_score NUMERIC(4,2),               -- 平均分
  duration_seconds INTEGER,                 -- 对话时长
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 对话消息表
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES user_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,

  -- 用户消息的评估（只针对 user 角色）
  grammar_score NUMERIC(4,2),               -- 语法分 (0-100)
  fluency_score NUMERIC(4,2),               -- 流畅度 (0-100)
  appropriateness_score NUMERIC(4,2),       -- 得体度 (0-100)
  overall_score NUMERIC(4,2),               -- 综合分 (0-100)

  corrections JSONB,                        -- 语法纠正 [{original, corrected, explanation}]
  suggestions JSONB,                        -- 改进建议 [{current, better, explanation}]
  feedback TEXT,                            -- 总体反馈

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 学习统计表
-- ============================================
CREATE TABLE IF NOT EXISTS user_conversation_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_conversations INTEGER DEFAULT 0,
  completed_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_score NUMERIC(4,2),
  best_score NUMERIC(4,2),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_status ON user_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);

-- ============================================
-- 6. RLS 策略
-- ============================================
ALTER TABLE ai_conversation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversation_stats ENABLE ROW LEVEL SECURITY;

-- 场景：所有人可读
CREATE POLICY "Anyone can view scenarios"
  ON ai_conversation_scenarios FOR SELECT
  USING (is_active = true);

-- 对话会话：用户只能访问自己的
CREATE POLICY "Users can view own conversations"
  ON user_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON user_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON user_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- 消息：用户只能访问自己对话的消息
CREATE POLICY "Users can view own messages"
  ON conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM user_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM user_conversations WHERE user_id = auth.uid()
    )
  );

-- 统计：用户只能访问自己的
CREATE POLICY "Users can view own stats"
  ON user_conversation_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_conversation_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_conversation_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. 初始场景数据
-- ============================================
INSERT INTO ai_conversation_scenarios (name, name_en, category, difficulty, icon, description, system_prompt, initial_message, tips) VALUES
(
  '技术面试',
  'Technical Interview',
  'interview',
  'intermediate',
  '💼',
  '模拟技术面试场景，面试官会询问你的技术背景、项目经验和技术问题',
  'You are a senior software engineer conducting a technical interview. Ask questions about the candidate''s experience, technical skills, and problem-solving abilities. Be professional but friendly. Evaluate their responses and provide constructive feedback.',
  'Hi! Thanks for joining us today. I''m excited to learn more about your background. Could you start by telling me about yourself and your experience in software development?',
  ARRAY[
    '保持专业和自信',
    '用 STAR 方法描述项目经验',
    '可以说 "Let me think about that for a moment"',
    '不知道可以诚实说 "I''m not familiar with that, but..."'
  ]
),
(
  '项目进度汇报',
  'Project Status Update',
  'report',
  'beginner',
  '📊',
  '向你的上司汇报项目进度、遇到的问题和下一步计划',
  'You are a project manager. The team member is reporting project progress to you. Ask about current status, challenges, and next steps. Be supportive and help them think through solutions.',
  'Good morning! I see we have our weekly check-in. How is the project coming along? Could you give me a status update?',
  ARRAY[
    '先说好消息，再说挑战',
    '使用具体数据和时间点',
    '主动提出解决方案',
    '常用：on track, behind schedule, ahead of schedule'
  ]
),
(
  '客户需求沟通',
  'Client Requirements Discussion',
  'negotiation',
  'intermediate',
  '🤝',
  '与客户讨论项目需求，理解他们的目标和期望',
  'You are a client who wants to build a new product. Discuss your requirements with the consultant. Be specific about what you want, but also be open to suggestions. Sometimes be unclear so they practice asking clarifying questions.',
  'Hello! Thank you for meeting with me. I have an idea for a project and I''d like to discuss the requirements with you. Are you ready to hear about it?',
  ARRAY[
    '多问开放性问题了解需求',
    '确认理解：So if I understand correctly...',
    '记录要点：Let me note that down',
    '设定期望：manage expectations'
  ]
),
(
  'Standup 会议',
  'Daily Standup Meeting',
  'meeting',
  'beginner',
  '☀️',
  '日常站会，快速同步昨天做了什么、今天计划做什么、有什么阻碍',
  'You are a scrum master running a daily standup. Ask the team member about: 1) What did you do yesterday? 2) What will you do today? 3) Any blockers? Keep it brief and focused.',
  'Good morning team! Let''s start our daily standup. What did you accomplish yesterday?',
  ARRAY[
    '保持简洁，控制在 2-3 分钟',
    '三个问题：Yesterday, Today, Blockers',
    '如果有问题说 "I''m blocked by..."',
    '不要展开细节，说 "Let''s discuss this after standup"'
  ]
),
(
  '技术方案讨论',
  'Technical Design Discussion',
  'meeting',
  'advanced',
  '🏗️',
  '与团队讨论技术方案设计，权衡不同选项的优缺点',
  'You are a senior architect reviewing a technical design proposal. Ask about the design decisions, trade-offs, scalability, and potential issues. Challenge their thinking to help them improve the design.',
  'I''ve reviewed your design doc. It looks interesting. Could you walk me through your key design decisions and why you chose this approach?',
  ARRAY[
    '准备讨论 pros and cons',
    '解释权衡：trade-offs',
    '考虑扩展性：scalability',
    '常用：bottleneck, edge case, fallback'
  ]
),
(
  '工作邮件场景',
  'Business Email Scenario',
  'negotiation',
  'beginner',
  '📧',
  '练习口头表达商务邮件的内容，如请求、确认、道歉等',
  'You are a colleague. Practice verbal communication of business email scenarios. The user will verbally express what they would write in an email. Help them use professional language and structure.',
  'Hi! I heard you need to send an important email. What''s the situation? Tell me what you want to communicate.',
  ARRAY[
    '清晰表达目的',
    '使用礼貌用语：I would appreciate...',
    '给出时间节点',
    '结尾：Please let me know if you need any clarification'
  ]
);
