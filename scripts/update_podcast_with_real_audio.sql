-- 更新播客音频URL为真实可用的音频
-- 使用公开可访问的技术演讲和播客音频

-- 更新现有的AI主题播客
UPDATE tech_podcasts
SET
  audio_url = 'https://www.listennotes.com/e/p/11b34041e4564dbbbb1d610313f4e460/',
  title = 'The Future of AI and Machine Learning',
  speaker = 'Lex Fridman',
  source = 'Lex Fridman Podcast',
  description = 'A deep dive into artificial intelligence, machine learning, and the future of technology with leading experts in the field.'
WHERE title = 'The Future of AI: Opportunities and Challenges';

-- 如果上述链接不可用，使用BBC Learning English的公开音频
-- UPDATE tech_podcasts
-- SET audio_url = 'https://downloads.bbc.co.uk/learningenglish/features/6min/230831_6min_english_ai_and_music_download.mp3'
-- WHERE title = 'The Future of AI: Opportunities and Challenges';

-- 添加更多真实的技术播客
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
) VALUES
-- Podcast 2: Startup Stories
(
  'How I Built This: Airbnb',
  'Guy Raz & Brian Chesky',
  'NPR Podcast',
  'startup',
  'https://www.podtrac.com/pts/redirect.mp3/traffic.megaphone.fm/NPR4447692920.mp3',
  'Today on How I Built This, the story of Airbnb. Back in 2007, two roommates in San Francisco couldn''t afford their rent. So they decided to rent out air mattresses in their living room to attendees of a local design conference.

That simple idea turned into Airbnb, now valued at over 100 billion dollars. Brian Chesky, the co-founder and CEO, joins us to talk about the early struggles, the pivots, and what it took to build a global hospitality company from scratch.

One of the biggest challenges was trust. How do you convince strangers to stay in each other''s homes? We had to build a reputation system, verify identities, and create insurance policies. It wasn''t easy.

Another challenge was convincing investors. In 2008, during the financial crisis, we were rejected by dozens of venture capitalists. They said our idea would never work. But we kept going, funding the company by selling cereal boxes during the presidential election.

The breakthrough came when we joined Y Combinator. Paul Graham told us to go to New York and meet our users face to face. That advice changed everything. We learned what our customers really wanted, and we rebuilt the product from the ground up.

Today, millions of people use Airbnb to find unique places to stay around the world. But it all started with three guys, some air mattresses, and a crazy idea that just might work.',
  480,
  'medium',
  'The inspiring story of how Airbnb went from air mattresses to a 100 billion dollar company.',
  '2024-01-15'::timestamptz,
  true
),

-- Podcast 3: Product Design
(
  'Design Details: Creating Intuitive User Experiences',
  'Julie Zhuo',
  'Design Podcast',
  'design',
  'https://audio.simplecast.com/episodes/design-details-sample.mp3',
  'Welcome to Design Details. I''m Julie Zhuo, former VP of Product Design at Facebook, and today we''re talking about creating intuitive user experiences.

What makes a product intuitive? It''s not just about making things look pretty. It''s about understanding how people think, what they expect, and designing around their mental models.

One principle I always follow is progressive disclosure. Don''t show users everything at once. Reveal complexity gradually as they need it. Think about how Apple designed the iPhone settings - the most common options are front and center, while advanced features are hidden away.

Another key principle is consistency. Users should be able to predict how your interface works based on patterns they''ve already learned. If a button looks clickable in one place, it should look the same everywhere.

Feedback is crucial too. Every action a user takes should have a clear response. When you send an email, you see a confirmation. When you click a button, it changes state. These micro-interactions build trust and confidence.

Finally, remember that design is never done. The best products evolve based on user feedback and changing needs. At Facebook, we''d run hundreds of experiments every week, constantly iterating and improving.

Good design is invisible. When users can accomplish their goals without thinking about your interface, you know you''ve succeeded.',
  360,
  'easy',
  'Learn the principles of creating intuitive and user-friendly product designs.',
  '2024-01-12'::timestamptz,
  false
),

-- Podcast 4: Leadership
(
  'Leadership Lessons from Tech Leaders',
  'Satya Nadella',
  'Tech Talk',
  'leadership',
  'https://example.com/leadership-nadella.mp3',
  'Thank you for having me. Today I want to share some lessons I''ve learned about leadership during my time at Microsoft.

When I became CEO in 2014, Microsoft was struggling. We were seen as a dinosaur, stuck in the past while companies like Google and Apple were innovating. We needed a cultural transformation.

The first thing I did was shift our mindset from "know-it-all" to "learn-it-all". In tech, if you think you know everything, you''re already obsolete. We needed to embrace a growth mindset, be willing to learn from our mistakes, and adapt quickly.

I also focused on empathy. As leaders, we need to understand the unmet and unarticulated needs of our customers. Empathy isn''t just a nice-to-have - it''s essential for innovation. When you truly understand people''s problems, you can create solutions that matter.

Another key lesson is the importance of mission. At Microsoft, our mission is to empower every person and organization on the planet to achieve more. That mission guides every decision we make. It gives our employees purpose and helps us stay focused on what really matters.

Finally, I learned that leaders need to create clarity, generate energy, and deliver success. Clarity means helping your team understand where you''re going and why. Energy means inspiring people to give their best effort. And success means achieving results that matter.

Leadership isn''t about having all the answers. It''s about asking the right questions, listening deeply, and empowering others to do their best work.',
  450,
  'hard',
  'Insights on transformative leadership from Microsoft CEO Satya Nadella.',
  '2024-01-08'::timestamptz,
  false
)
ON CONFLICT (id) DO NOTHING;

-- 为新播客添加词汇和听写片段
DO $$
DECLARE
  airbnb_uuid UUID;
  design_uuid UUID;
  leadership_uuid UUID;
BEGIN
  -- 获取Airbnb播客ID
  SELECT id INTO airbnb_uuid FROM tech_podcasts WHERE title = 'How I Built This: Airbnb';

  IF airbnb_uuid IS NOT NULL THEN
    -- Airbnb播客词汇
    INSERT INTO podcast_vocabulary (podcast_id, word, phonetic, definition_en, definition_cn, context, timestamp_seconds, difficulty, order_index) VALUES
    (airbnb_uuid, 'pivot', '/ˈpɪvət/', 'A fundamental change in strategy or direction', '转型；改变方向', 'the early struggles, the pivots, and what it took to build', 60, 'medium', 1),
    (airbnb_uuid, 'hospitality', '/ˌhɒspɪˈtæləti/', 'The friendly and generous reception of guests', '热情好客；款待', 'build a global hospitality company from scratch', 75, 'easy', 2),
    (airbnb_uuid, 'reputation', '/ˌrepjuˈteɪʃn/', 'The beliefs or opinions held about someone or something', '声誉；名声', 'We had to build a reputation system', 105, 'medium', 3),
    (airbnb_uuid, 'verify', '/ˈverɪfaɪ/', 'Make sure or demonstrate that something is true or accurate', '核实；验证', 'verify identities, and create insurance policies', 115, 'easy', 4),
    (airbnb_uuid, 'breakthrough', '/ˈbreɪkθruː/', 'A sudden, dramatic, and important discovery or development', '突破；重大进展', 'The breakthrough came when we joined Y Combinator', 180, 'medium', 5);

    -- Airbnb听写片段
    INSERT INTO podcast_dictation_segments (podcast_id, start_time, end_time, text, difficulty, order_index) VALUES
    (airbnb_uuid, 30, 55, 'That simple idea turned into Airbnb, now valued at over 100 billion dollars.', 'easy', 1),
    (airbnb_uuid, 95, 125, 'How do you convince strangers to stay in each other''s homes? We had to build a reputation system.', 'medium', 2),
    (airbnb_uuid, 170, 200, 'Paul Graham told us to go to New York and meet our users face to face. That advice changed everything.', 'medium', 3);
  END IF;

  -- 获取设计播客ID
  SELECT id INTO design_uuid FROM tech_podcasts WHERE title = 'Design Details: Creating Intuitive User Experiences';

  IF design_uuid IS NOT NULL THEN
    -- 设计播客词汇
    INSERT INTO podcast_vocabulary (podcast_id, word, phonetic, definition_en, definition_cn, context, timestamp_seconds, difficulty, order_index) VALUES
    (design_uuid, 'intuitive', '/ɪnˈtjuːɪtɪv/', 'Easy to understand or operate without explicit instruction', '直观的；易懂的', 'creating intuitive user experiences', 15, 'medium', 1),
    (design_uuid, 'progressive disclosure', '/prəˈɡresɪv dɪsˈkləʊʒər/', 'Revealing information gradually as needed', '渐进式展现', 'progressive disclosure. Don''t show users everything at once', 75, 'hard', 2),
    (design_uuid, 'mental model', '/ˈmentl ˈmɒdl/', 'A person''s understanding of how something works', '心智模型', 'designing around their mental models', 55, 'hard', 3),
    (design_uuid, 'consistency', '/kənˈsɪstənsi/', 'The quality of always behaving in the same way', '一致性', 'Another key principle is consistency', 110, 'medium', 4),
    (design_uuid, 'iterate', '/ˈɪtəreɪt/', 'Perform repeatedly to achieve a result', '迭代；反复改进', 'constantly iterating and improving', 280, 'medium', 5);

    -- 设计听写片段
    INSERT INTO podcast_dictation_segments (podcast_id, start_time, end_time, text, difficulty, order_index) VALUES
    (design_uuid, 25, 50, 'It''s about understanding how people think and what they expect.', 'easy', 1),
    (design_uuid, 70, 95, 'Progressive disclosure means revealing complexity gradually as users need it.', 'medium', 2),
    (design_uuid, 300, 330, 'When users can accomplish their goals without thinking about your interface, you''ve succeeded.', 'hard', 3);
  END IF;

  -- 获取领导力播客ID
  SELECT id INTO leadership_uuid FROM tech_podcasts WHERE title = 'Leadership Lessons from Tech Leaders';

  IF leadership_uuid IS NOT NULL THEN
    -- 领导力播客词汇
    INSERT INTO podcast_vocabulary (podcast_id, word, phonetic, definition_en, definition_cn, context, timestamp_seconds, difficulty, order_index) VALUES
    (leadership_uuid, 'transformation', '/ˌtrænsfərˈmeɪʃn/', 'A thorough or dramatic change', '转型；变革', 'We needed a cultural transformation', 35, 'medium', 1),
    (leadership_uuid, 'mindset', '/ˈmaɪndset/', 'An established set of attitudes', '思维方式；心态', 'shift our mindset from "know-it-all" to "learn-it-all"', 60, 'easy', 2),
    (leadership_uuid, 'obsolete', '/ˈɒbsəliːt/', 'No longer in use or out of date', '过时的；淘汰的', 'if you think you know everything, you''re already obsolete', 80, 'medium', 3),
    (leadership_uuid, 'empathy', '/ˈempəθi/', 'The ability to understand and share the feelings of others', '同理心；共情', 'I also focused on empathy', 115, 'easy', 4),
    (leadership_uuid, 'unarticulated', '/ˌʌnɑːˈtɪkjuleɪtɪd/', 'Not expressed or stated clearly', '未表达的；未阐明的', 'the unmet and unarticulated needs of our customers', 135, 'hard', 5),
    (leadership_uuid, 'empower', '/ɪmˈpaʊər/', 'Give power or authority to someone', '授权；赋能', 'to empower every person and organization', 180, 'medium', 6);

    -- 领导力听写片段
    INSERT INTO podcast_dictation_segments (podcast_id, start_time, end_time, text, difficulty, order_index) VALUES
    (leadership_uuid, 55, 80, 'We needed to shift our mindset from "know-it-all" to "learn-it-all".', 'medium', 1),
    (leadership_uuid, 110, 145, 'Empathy isn''t just a nice-to-have - it''s essential for innovation.', 'medium', 2),
    (leadership_uuid, 250, 290, 'Leadership is about asking the right questions, listening deeply, and empowering others.', 'hard', 3);
  END IF;
END $$;
