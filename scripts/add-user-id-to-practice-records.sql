-- 为 practice_records 表添加 user_id 字段
ALTER TABLE practice_records
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON practice_records(user_id);

-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Enable all operations for all users" ON practice_records;

-- 创建新的 RLS 策略：用户只能查看和管理自己的记录
CREATE POLICY "Users can view own records" ON practice_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON practice_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON practice_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON practice_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- 为 member_name 字段添加默认值（从用户邮箱提取用户名）
-- 注意：对于已有的记录，需要手动更新或者在应用层处理
