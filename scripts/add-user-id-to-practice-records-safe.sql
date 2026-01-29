-- 安全版本的数据库迁移脚本（可重复执行）
-- 为 practice_records 表添加 user_id 字段并更新 RLS 策略

-- ============================================
-- 1. 添加 user_id 字段（如果不存在）
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_records'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE practice_records ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Column user_id added to practice_records';
  ELSE
    RAISE NOTICE 'Column user_id already exists in practice_records';
  END IF;
END $$;

-- ============================================
-- 2. 创建索引（如果不存在）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON practice_records(user_id);

-- ============================================
-- 3. 删除旧的 RLS 策略（如果存在）
-- ============================================
DROP POLICY IF EXISTS "Enable all operations for all users" ON practice_records;
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;

-- ============================================
-- 4. 创建新的 RLS 策略
-- ============================================

-- 用户只能查看自己的记录
CREATE POLICY "Users can view own records" ON practice_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的记录
CREATE POLICY "Users can insert own records" ON practice_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的记录
CREATE POLICY "Users can update own records" ON practice_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的记录
CREATE POLICY "Users can delete own records" ON practice_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. 验证迁移结果
-- ============================================

-- 显示表结构（检查 user_id 字段）
DO $$
DECLARE
  has_user_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_records'
    AND column_name = 'user_id'
  ) INTO has_user_id;

  IF has_user_id THEN
    RAISE NOTICE '✅ Migration successful: user_id column exists';
  ELSE
    RAISE WARNING '❌ Migration failed: user_id column not found';
  END IF;
END $$;

-- 显示策略数量
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'practice_records';

  RAISE NOTICE '✅ Total policies for practice_records: %', policy_count;
END $$;
