-- 将所有placeholder音频更新为可用的公开音频URL
-- 使用SoundHelix的公开测试音频

UPDATE tech_podcasts
SET audio_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
WHERE audio_url LIKE '%example.com%' OR audio_url LIKE '%placeholder%'
RETURNING title, audio_url;

-- 或者使用这些可靠的公开音频资源:

-- 选项1: 使用Free Music Archive的CC0音乐
-- UPDATE tech_podcasts
-- SET audio_url = 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3'
-- WHERE audio_url LIKE '%example.com%';

-- 选项2: 使用Internet Archive的公开音频（需要具体的URL）
-- UPDATE tech_podcasts
-- SET audio_url = 'https://ia801405.us.archive.org/7/items/MLKDream/MLKDream.mp3'
-- WHERE audio_url LIKE '%example.com%';

-- 选项3: 使用公开的播客RSS源（这些通常更可靠）
-- The Changelog: https://feeds.simplecast.com/54nAGcIl
-- Software Engineering Daily: https://softwareengineeringdaily.com/feed/podcast/
-- Tech Meme Ride Home: https://feeds.megaphone.fm/techmeme

-- 查看更新后的结果
SELECT title, audio_url, duration_seconds
FROM tech_podcasts
ORDER BY published_at DESC;
