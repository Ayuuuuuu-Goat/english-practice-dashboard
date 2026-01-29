# 数据库迁移说明

## 概述

为了让每个用户只能看到和管理自己的学习记录，我们需要对数据库进行迁移，添加 `user_id` 字段并更新 Row Level Security (RLS) 策略。

**新功能**：首页总览现在整合了三种学习数据：
1. 手动添加的练习记录 (`practice_records`)
2. 发音训练统计 (`daily_practice_stats`)
3. 视频学习记录 (`user_video_checkins`)

所有数据都会在首页的趋势图表中统一展示。

## 迁移步骤

### 1. 登录 Supabase Dashboard

访问：https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou

### 2. 进入 SQL Editor

在左侧菜单中，点击 "SQL Editor"

### 3. 执行迁移脚本

复制 `/scripts/add-user-id-to-practice-records.sql` 文件的内容，粘贴到 SQL Editor 中，然后点击 "Run" 执行。

脚本内容：

```sql
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
```

### 4. 处理已有数据（如果有的话）

如果表中已有数据但没有 `user_id`，你需要手动更新这些记录：

```sql
-- 查看没有 user_id 的记录
SELECT * FROM practice_records WHERE user_id IS NULL;

-- 如果需要将现有记录分配给特定用户，执行类似下面的命令
-- 将 'USER_EMAIL' 替换为实际的用户邮箱
UPDATE practice_records
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL'
)
WHERE user_id IS NULL AND member_name = '成员名';
```

### 5. 验证迁移

执行以下查询验证迁移是否成功：

```sql
-- 检查表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'practice_records'
ORDER BY ordinal_position;

-- 检查 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'practice_records';
```

## 前端代码更改

以下代码已经更新，迁移数据库后即可使用：

1. ✅ 移除了添加记录时的"成员姓名"输入框
2. ✅ 自动使用当前登录用户的邮箱前缀作为成员名称
3. ✅ 查询记录时只获取当前用户的数据
4. ✅ 插入记录时自动关联 user_id
5. ✅ 移除了"成员数据"菜单项
6. ✅ 更新了搜索功能（搜索日期和备注）

## 测试

迁移完成后，使用测试账号登录：

- 邮箱：`gina@test.com`
- 密码：`gina888`

验证：
1. 只能看到自己的学习记录
2. 添加新记录时不需要输入成员姓名
3. 新记录自动关联到当前用户
4. 无法看到其他用户的记录

## 回滚（如果需要）

如果需要回滚到之前的状态：

```sql
-- 删除新的 RLS 策略
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;

-- 恢复旧的策略
CREATE POLICY "Enable all operations for all users" ON practice_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 删除 user_id 字段（可选）
ALTER TABLE practice_records DROP COLUMN IF EXISTS user_id;
```
