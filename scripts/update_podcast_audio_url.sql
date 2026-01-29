-- 更新播客音频URL为可用的测试音频

-- 方案1: 使用公开的示例音频（BBC Learning English）
UPDATE tech_podcasts
SET audio_url = 'https://downloads.bbc.co.uk/learningenglish/features/6min/230831_6min_english_ai_and_music_download.mp3'
WHERE title = 'The Future of AI: Opportunities and Challenges';

-- 如果上面的URL不可用，可以尝试这些替代方案：

-- 方案2: 使用其他公开音频资源
-- UPDATE tech_podcasts
-- SET audio_url = 'https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0010_8k.wav'
-- WHERE title = 'The Future of AI: Opportunities and Challenges';

-- 方案3: 使用文字转语音生成的音频（需要先生成）
-- UPDATE tech_podcasts
-- SET audio_url = 'YOUR_GENERATED_AUDIO_URL'
-- WHERE title = 'The Future of AI: Opportunities and Challenges';

-- 注意：
-- 1. 确保音频URL是可公开访问的
-- 2. 支持的格式: mp3, wav, ogg
-- 3. 建议使用HTTPS协议
-- 4. 文件大小建议控制在10MB以内
