-- 删除所有现有的马叫音频播客
DELETE FROM tech_podcasts WHERE audio_url LIKE '%horse%' OR audio_url LIKE '%Epoq%';

-- 确认删除
SELECT COUNT(*) as remaining_podcasts FROM tech_podcasts;
