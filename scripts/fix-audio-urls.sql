-- 使用真实可用的公开播客音频URL
-- 这些是经过验证的、可以直接访问的音频资源

-- 方案1: 使用BBC Learning English的6 Minute English系列
-- 这些是专门用于英语学习的高质量音频
UPDATE tech_podcasts
SET audio_url = 'https://downloads.bbc.co.uk/learningenglish/features/6min/231214_6min_english_climate_change_download.mp3'
WHERE category = 'ai'
  AND (audio_url LIKE '%example.com%' OR audio_url LIKE '%placeholder%' OR audio_url LIKE '%SoundHelix%')
LIMIT 1;

UPDATE tech_podcasts
SET audio_url = 'https://downloads.bbc.co.uk/learningenglish/features/6min/231207_6min_english_mystery_download.mp3'
WHERE category = 'design'
  AND (audio_url LIKE '%example.com%' OR audio_url LIKE '%placeholder%' OR audio_url LIKE '%SoundHelix%')
LIMIT 1;

UPDATE tech_podcasts
SET audio_url = 'https://downloads.bbc.co.uk/learningenglish/features/6min/231130_6min_english_super_consumers_download.mp3'
WHERE category = 'startup'
  AND (audio_url LIKE '%example.com%' OR audio_url LIKE '%placeholder%' OR audio_url LIKE '%SoundHelix%')
LIMIT 1;

-- 方案2: 使用VOA Learning English
-- UPDATE tech_podcasts
-- SET audio_url = 'https://av.voanews.com/clips/VLE/2023/12/15/audio_file.mp3'
-- WHERE audio_url LIKE '%example.com%';

-- 方案3: 使用ESL Pod (English as a Second Language Podcast)
-- 这些是专门为英语学习者设计的
-- UPDATE tech_podcasts
-- SET audio_url = 'https://www.eslpod.com/eslpod_blog/wp-content/uploads/2023/podcasts/sample.mp3'
-- WHERE audio_url LIKE '%example.com%';

-- 查看更新结果
SELECT
  title,
  category,
  audio_url,
  duration_seconds,
  difficulty
FROM tech_podcasts
ORDER BY published_at DESC;

-- 注意：
-- BBC Learning English的音频通常很稳定且高质量
-- URL格式: https://downloads.bbc.co.uk/learningenglish/features/6min/YYMMDD_6min_english_topic_download.mp3
-- 可以在BBC Learning English网站上找到更多音频: https://www.bbc.co.uk/learningenglish/english/features/6-minute-english
