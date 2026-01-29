-- 行业报告表
CREATE TABLE IF NOT EXISTS industry_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'ai', 'tech', 'business'
  source TEXT, -- 报告来源
  source_url TEXT, -- 原始报告链接
  content TEXT NOT NULL, -- 报告完整内容（markdown格式）
  summary TEXT, -- 报告简介
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  reading_time_minutes INTEGER, -- 预计阅读时间（分钟）
  published_at TIMESTAMPTZ, -- 报告发布日期
  week_number INTEGER, -- 第几周的报告
  year INTEGER, -- 年份
  is_featured BOOLEAN DEFAULT false, -- 是否精选
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 重点词汇表
CREATE TABLE IF NOT EXISTS report_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES industry_reports(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT, -- 音标
  definition_en TEXT NOT NULL, -- 英文释义
  definition_cn TEXT NOT NULL, -- 中文释义
  example_sentence TEXT, -- 例句
  word_type TEXT, -- 词性: noun, verb, adjective, etc.
  difficulty TEXT DEFAULT 'medium',
  order_index INTEGER DEFAULT 0, -- 显示顺序
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 讨论问题表
CREATE TABLE IF NOT EXISTS report_discussion_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES industry_reports(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'open', -- 'open', 'analysis', 'opinion'
  sample_answer TEXT, -- 参考答案
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户报告进度表
CREATE TABLE IF NOT EXISTS user_report_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_id UUID REFERENCES industry_reports(id) ON DELETE CASCADE,
  reading_progress INTEGER DEFAULT 0, -- 阅读进度百分比 0-100
  vocabulary_learned INTEGER DEFAULT 0, -- 已学词汇数
  has_written_summary BOOLEAN DEFAULT false,
  has_answered_questions BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, report_id)
);

-- 用户摘要表
CREATE TABLE IF NOT EXISTS user_report_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_id UUID REFERENCES industry_reports(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  word_count INTEGER,
  ai_feedback JSONB, -- AI评分和反馈
  score INTEGER, -- 0-100
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户讨论回答表
CREATE TABLE IF NOT EXISTS user_discussion_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_id UUID REFERENCES industry_reports(id) ON DELETE CASCADE,
  question_id UUID REFERENCES report_discussion_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  ai_feedback JSONB, -- AI评价
  score INTEGER, -- 0-100
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_industry_reports_category ON industry_reports(category);
CREATE INDEX IF NOT EXISTS idx_industry_reports_week ON industry_reports(week_number, year);
CREATE INDEX IF NOT EXISTS idx_industry_reports_featured ON industry_reports(is_featured);
CREATE INDEX IF NOT EXISTS idx_report_vocabulary_report ON report_vocabulary(report_id);
CREATE INDEX IF NOT EXISTS idx_report_questions_report ON report_discussion_questions(report_id);
CREATE INDEX IF NOT EXISTS idx_user_report_progress_user ON user_report_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_report_progress_report ON user_report_progress(report_id);
CREATE INDEX IF NOT EXISTS idx_user_summaries_user ON user_report_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON user_discussion_answers(user_id);

-- 启用 RLS
ALTER TABLE industry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_discussion_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_report_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_report_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_discussion_answers ENABLE ROW LEVEL SECURITY;

-- RLS 策略：报告和词汇、问题对所有认证用户可读
CREATE POLICY "Reports are viewable by authenticated users"
  ON industry_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vocabulary is viewable by authenticated users"
  ON report_vocabulary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are viewable by authenticated users"
  ON report_discussion_questions FOR SELECT
  TO authenticated
  USING (true);

-- RLS 策略：用户只能看到自己的进度
CREATE POLICY "Users can view own progress"
  ON user_report_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_report_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_report_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能看到自己的摘要
CREATE POLICY "Users can view own summaries"
  ON user_report_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON user_report_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
  ON user_report_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能看到自己的回答
CREATE POLICY "Users can view own answers"
  ON user_discussion_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON user_discussion_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON user_discussion_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 插入示例数据
INSERT INTO industry_reports (
  title,
  category,
  source,
  source_url,
  content,
  summary,
  difficulty,
  reading_time_minutes,
  published_at,
  week_number,
  year,
  is_featured
) VALUES (
  'The State of AI in 2024: Breakthroughs and Challenges',
  'ai',
  'MIT Technology Review',
  'https://example.com/ai-report-2024',
  '# The State of AI in 2024: Breakthroughs and Challenges

## Executive Summary

Artificial Intelligence has reached unprecedented levels of capability in 2024, with large language models, computer vision, and autonomous systems achieving remarkable milestones. However, alongside these technological advances come significant challenges in ethics, regulation, and societal impact.

## Key Developments

### 1. Large Language Models Evolution

The landscape of large language models (LLMs) has transformed dramatically. Models now exhibit emergent abilities that were previously thought impossible, including:

- **Advanced reasoning**: LLMs can now break down complex problems into logical steps, approaching human-level performance in mathematical reasoning and scientific analysis.
- **Multimodal understanding**: Integration of text, image, video, and audio processing enables more comprehensive AI systems.
- **Tool use**: Modern LLMs can autonomously decide when and how to use external tools, APIs, and databases to accomplish tasks.

### 2. Enterprise Adoption

Businesses across industries are integrating AI at an accelerating pace:

- **Customer service**: AI-powered chatbots handle 70% of routine inquiries, with customer satisfaction rates approaching human agent levels.
- **Software development**: AI coding assistants have increased developer productivity by an average of 35%.
- **Healthcare**: AI diagnostic tools now assist in detecting diseases with accuracy matching or exceeding specialist physicians.

### 3. Regulatory Landscape

Governments worldwide are implementing AI regulations:

- **European Union**: The AI Act establishes risk-based frameworks for AI deployment.
- **United States**: Sector-specific regulations emerging for healthcare, finance, and transportation.
- **China**: Comprehensive AI governance framework balancing innovation with control.

## Challenges and Concerns

### Ethical Considerations

- **Bias and fairness**: AI systems continue to exhibit biases inherited from training data.
- **Privacy**: Large-scale data collection raises serious privacy concerns.
- **Transparency**: The "black box" nature of neural networks makes decision-making opaque.

### Economic Impact

- **Job displacement**: Automation threatens traditional white-collar jobs.
- **Skill gaps**: Workforce retraining cannot keep pace with AI advancement.
- **Market concentration**: AI development concentrated among a few tech giants.

### Technical Limitations

- **Hallucinations**: LLMs still generate convincing but false information.
- **Energy consumption**: Training large models requires enormous computational resources.
- **Alignment**: Ensuring AI systems behave according to human values remains unsolved.

## Future Outlook

The next phase of AI development will likely focus on:

1. **Improving reliability**: Reducing errors and hallucinations in AI outputs.
2. **Enhancing safety**: Building robust safeguards against misuse.
3. **Democratizing access**: Making AI tools available beyond tech giants.
4. **Addressing societal impact**: Proactively managing AI''s effects on employment and society.

## Conclusion

AI in 2024 stands at a critical juncture. The technology has proven its transformative potential, but realizing its benefits while mitigating risks requires coordinated effort from technologists, policymakers, and society at large. The decisions made today will shape how AI impacts humanity for decades to come.',
  'A comprehensive analysis of AI advancements in 2024, covering breakthrough developments in LLMs, enterprise adoption, regulatory frameworks, and the critical challenges of ethics, economics, and technical limitations.',
  'medium',
  15,
  '2024-01-15'::timestamptz,
  3,
  2024,
  true
);

-- 获取刚插入的报告ID（用于关联词汇和问题）
DO $$
DECLARE
  report_uuid UUID;
BEGIN
  SELECT id INTO report_uuid FROM industry_reports WHERE title = 'The State of AI in 2024: Breakthroughs and Challenges';

  -- 插入重点词汇
  INSERT INTO report_vocabulary (report_id, word, phonetic, definition_en, definition_cn, example_sentence, word_type, difficulty, order_index) VALUES
  (report_uuid, 'unprecedented', '/ʌnˈpresɪdentɪd/', 'Never done or known before; without previous example', '前所未有的；空前的', 'The technology has reached unprecedented levels of capability.', 'adjective', 'medium', 1),
  (report_uuid, 'emergent', '/ɪˈmɜːrdʒənt/', 'Arising or occurring as a natural result', '涌现的；新兴的', 'Models exhibit emergent abilities that were previously impossible.', 'adjective', 'medium', 2),
  (report_uuid, 'multimodal', '/ˌmʌltiˈməʊdl/', 'Having or involving several modes, modalities, or methods', '多模态的', 'Multimodal AI can process text, images, and audio simultaneously.', 'adjective', 'hard', 3),
  (report_uuid, 'accelerating', '/əkˈseləreɪtɪŋ/', 'Increasing in speed or rate', '加速的', 'Businesses are integrating AI at an accelerating pace.', 'adjective', 'easy', 4),
  (report_uuid, 'diagnostic', '/ˌdaɪəɡˈnɒstɪk/', 'Concerned with the diagnosis of illness or other problems', '诊断的', 'AI diagnostic tools can detect diseases with high accuracy.', 'adjective', 'medium', 5),
  (report_uuid, 'opaque', '/əʊˈpeɪk/', 'Not able to be seen through; not transparent or translucent', '不透明的；难以理解的', 'The black box nature of neural networks makes them opaque.', 'adjective', 'hard', 6),
  (report_uuid, 'displacement', '/dɪsˈpleɪsmənt/', 'The moving of something from its place or position', '替代；位移', 'Automation causes job displacement in many sectors.', 'noun', 'medium', 7),
  (report_uuid, 'hallucination', '/həˌluːsɪˈneɪʃn/', 'An experience involving false perception', '幻觉；（AI的）虚构内容', 'LLMs sometimes produce hallucinations - false but convincing information.', 'noun', 'hard', 8),
  (report_uuid, 'alignment', '/əˈlaɪnmənt/', 'Arrangement in a straight line or in correct relative positions', '对齐；（AI）价值观对齐', 'AI alignment ensures systems behave according to human values.', 'noun', 'hard', 9),
  (report_uuid, 'mitigate', '/ˈmɪtɪɡeɪt/', 'Make less severe, serious, or painful', '减轻；缓和', 'We must mitigate the risks of AI deployment.', 'verb', 'medium', 10);

  -- 插入讨论问题
  INSERT INTO report_discussion_questions (report_id, question, question_type, sample_answer, order_index) VALUES
  (report_uuid, 'What do you think is the most significant AI breakthrough mentioned in this report, and why?', 'opinion', 'I believe the advancement in multimodal understanding is most significant because it enables AI to process information more like humans do - combining visual, textual, and auditory inputs. This capability opens up applications that were previously impossible, such as AI systems that can understand complex real-world scenarios by combining different types of sensory information.', 1),
  (report_uuid, 'How might the job displacement caused by AI affect your industry or field of work?', 'analysis', 'In the software industry, AI coding assistants are already changing how developers work. While they increase productivity by 35%, they may also reduce demand for junior developers who primarily write routine code. However, this could shift the role toward higher-level system design and problem-solving. Companies will need to invest in retraining programs to help workers adapt to working alongside AI tools.', 2),
  (report_uuid, 'The report mentions AI "hallucinations" as a challenge. Can you think of scenarios where this could be particularly dangerous?', 'analysis', 'AI hallucinations could be extremely dangerous in healthcare, where an AI diagnostic tool might confidently provide incorrect medical advice. In legal settings, AI-generated case citations that don''t exist could undermine justice. In financial advising, hallucinated market data could lead to catastrophic investment decisions. These scenarios all share a common risk: the AI''s confident presentation of false information could lead users to trust and act on incorrect data.', 3),
  (report_uuid, 'What measures do you think should be prioritized to address the ethical concerns raised in the report?', 'opinion', 'I think transparency should be the top priority. If we can understand how AI systems make decisions, we can better identify and correct biases. This requires both technical solutions (like interpretable AI) and regulatory requirements for disclosure. Additionally, diverse teams should be involved in AI development to catch potential biases early. Finally, establishing clear accountability frameworks so there''s always a human responsible for AI decisions would help ensure ethical deployment.', 4);
END $$;
