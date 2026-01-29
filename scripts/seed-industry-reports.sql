-- 插入示例行业报告数据

-- 插入AI行业报告
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
  'The State of AI in 2026',
  'ai',
  'OpenAI Research',
  'https://openai.com/research',
  '# The State of AI in 2026

## Executive Summary

Artificial Intelligence has reached unprecedented levels of capability in 2026. Large language models now demonstrate remarkable reasoning abilities, multimodal understanding, and creative problem-solving skills.

## Key Developments

### 1. Enhanced Reasoning Capabilities
Modern AI systems can now solve complex mathematical problems, write sophisticated code, and engage in nuanced philosophical discussions.

### 2. Multimodal Integration
The integration of text, image, video, and audio processing has created truly multimodal AI assistants capable of understanding context across different media types.

### 3. Real-world Applications
- **Healthcare**: AI-powered diagnostic tools achieving 95% accuracy
- **Education**: Personalized learning systems adapting to individual student needs
- **Business**: Automated decision-making tools improving efficiency by 40%

## Challenges Ahead

Despite remarkable progress, several challenges remain:
- Ensuring AI safety and alignment
- Addressing bias in training data
- Managing computational costs
- Establishing ethical guidelines

## Conclusion

The future of AI looks promising, but responsible development remains crucial.',
  'A comprehensive overview of AI developments in 2026, covering breakthroughs in reasoning, multimodal capabilities, and real-world applications.',
  'medium',
  15,
  NOW(),
  1,
  2026,
  true
);

-- 获取刚插入的报告ID
DO $$
DECLARE
  report_id UUID;
BEGIN
  SELECT id INTO report_id FROM industry_reports WHERE title = 'The State of AI in 2026' LIMIT 1;

  -- 插入词汇
  INSERT INTO report_vocabulary (report_id, word, phonetic, definition_en, definition_cn, example_sentence, word_type, difficulty, order_index) VALUES
  (report_id, 'unprecedented', '/ʌnˈpresɪdentɪd/', 'never done or known before', '前所未有的', 'The technology achieved unprecedented levels of accuracy.', 'adjective', 'medium', 1),
  (report_id, 'nuanced', '/ˈnjuːɑːnst/', 'characterized by subtle shades of meaning', '细致入微的', 'The AI can engage in nuanced discussions.', 'adjective', 'hard', 2),
  (report_id, 'diagnostic', '/ˌdaɪəɡˈnɒstɪk/', 'concerned with diagnosis', '诊断的', 'AI-powered diagnostic tools are revolutionizing healthcare.', 'adjective', 'medium', 3),
  (report_id, 'alignment', '/əˈlaɪnmənt/', 'arrangement in a straight line', '对齐、一致', 'Ensuring AI safety and alignment is crucial.', 'noun', 'medium', 4);

  -- 插入讨论问题
  INSERT INTO report_discussion_questions (report_id, question, question_type, sample_answer, order_index) VALUES
  (report_id, 'What are the most significant challenges facing AI development in 2026?', 'analysis', 'The most significant challenges include ensuring AI safety and alignment with human values, addressing inherent biases in training data, managing the substantial computational costs of training and running large models, and establishing clear ethical guidelines for AI deployment across different sectors.', 1),
  (report_id, 'How might AI impact your industry or field of work?', 'opinion', 'This is a personal response that should reflect on specific applications relevant to the reader''s field. For example, in education, AI could enable truly personalized learning experiences; in healthcare, it could provide early disease detection; in creative fields, it could serve as a collaborative tool for ideation.', 2),
  (report_id, 'Do you think the benefits of AI outweigh the risks? Why or why not?', 'open', 'This requires balanced consideration of both benefits (improved efficiency, better decision-making, enhanced capabilities) and risks (job displacement, privacy concerns, potential misuse). A thoughtful answer should acknowledge both sides while taking a reasoned position.', 3);
END$$;
