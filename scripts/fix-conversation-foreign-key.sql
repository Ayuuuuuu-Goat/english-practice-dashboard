-- 修复conversation_session_results表的外键约束问题
-- 因为我们不再使用auth.users，所以移除user_id的外键约束

-- 1. 删除外键约束
ALTER TABLE conversation_session_results
DROP CONSTRAINT IF EXISTS conversation_session_results_user_id_fkey;

-- 2. 确认user_id字段是UUID类型
-- 如果不是，则修改为UUID类型
-- ALTER TABLE conversation_session_results
-- ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 3. 为user_id添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversation_user_id
ON conversation_session_results(user_id);

-- 完成！现在user_id字段可以接受任何UUID值，不需要在auth.users中存在
