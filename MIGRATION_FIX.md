# 数据库迁移修复指南

## 问题说明

如果在执行迁移时遇到错误：
```
ERROR: 42710: policy "Users can view own records" for table "practice_records" already exists
```

这说明策略已经部分创建了。使用下面的安全版本脚本即可。

---

## 解决方案：使用安全版本脚本

### 步骤 1：访问 Supabase Dashboard

```
https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou
```

### 步骤 2：进入 SQL Editor

左侧菜单 → **SQL Editor**

### 步骤 3：执行安全版本脚本

**复制以下文件内容并执行**：

```
scripts/add-user-id-to-practice-records-safe.sql
```

这个脚本可以安全地重复执行，不会报错。

---

## 脚本特性

### ✅ 安全特性
- 检查字段是否存在再添加
- 先删除旧策略，避免重复创建
- 使用 `IF NOT EXISTS` 创建索引
- 自动验证迁移结果

### ✅ 执行结果
执行成功后会显示：
```
NOTICE: Column user_id already exists in practice_records
NOTICE: ✅ Migration successful: user_id column exists
NOTICE: ✅ Total policies for practice_records: 4
```

---

## 方案二：手动检查和修复

如果你想了解当前状态，可以先执行以下查询：

### 1. 检查 user_id 字段
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'practice_records'
ORDER BY ordinal_position;
```

**期望结果**：应该看到 `user_id` 字段（类型 UUID）

### 2. 检查现有策略
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'practice_records';
```

**期望结果**：应该有4个策略
- Users can view own records (SELECT)
- Users can insert own records (INSERT)
- Users can update own records (UPDATE)
- Users can delete own records (DELETE)

### 3. 检查索引
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'practice_records';
```

**期望结果**：应该包含 `idx_practice_records_user_id`

---

## 如果 user_id 字段不存在

执行以下单独语句：

```sql
-- 添加字段
ALTER TABLE practice_records
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON practice_records(user_id);
```

---

## 如果策略不正确

### 清理所有旧策略
```sql
DROP POLICY IF EXISTS "Enable all operations for all users" ON practice_records;
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;
```

### 创建正确的策略
```sql
-- 查看
CREATE POLICY "Users can view own records" ON practice_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- 插入
CREATE POLICY "Users can insert own records" ON practice_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新
CREATE POLICY "Users can update own records" ON practice_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 删除
CREATE POLICY "Users can delete own records" ON practice_records
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 验证迁移成功

执行以下查询确认一切正常：

```sql
-- 1. 检查字段
SELECT column_name FROM information_schema.columns
WHERE table_name = 'practice_records' AND column_name = 'user_id';
-- 应返回：user_id

-- 2. 检查策略数量
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'practice_records';
-- 应返回：4

-- 3. 检查索引
SELECT 1 FROM pg_indexes
WHERE tablename = 'practice_records' AND indexname = 'idx_practice_records_user_id';
-- 应返回：1
```

如果以上三个查询都返回期望结果，说明迁移成功！✅

---

## 测试数据隔离

迁移完成后，测试用户数据隔离：

### 1. 登录测试账号
```
邮箱：gina@test.com
密码：gina888
```

### 2. 添加一条测试记录
在首页点击"新增记录"，添加一条记录

### 3. 验证 RLS 生效
在 Supabase SQL Editor 中执行：

```sql
-- 查看 gina 用户的记录
SELECT * FROM practice_records
WHERE user_id = '85ae1820-b45d-4bd6-b4e4-08ce03251145';
```

应该能看到刚才添加的记录。

### 4. 验证隔离性
尝试查询其他用户的记录（如果有的话）：

```sql
-- 尝试查询所有记录（使用 service role key）
SELECT id, user_id, member_name, date, duration
FROM practice_records
LIMIT 5;
```

每个用户应该只有自己的记录。

---

## 常见问题

### Q: 执行脚本后仍然报错？
**A**: 请使用 `add-user-id-to-practice-records-safe.sql`，这是专门设计的安全版本。

### Q: 旧数据怎么办？
**A**: 如果有旧的记录（user_id 为 NULL），需要手动分配给用户：

```sql
-- 查看没有 user_id 的记录
SELECT * FROM practice_records WHERE user_id IS NULL;

-- 为特定用户分配记录（替换邮箱和成员名）
UPDATE practice_records
SET user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
WHERE user_id IS NULL AND member_name = '成员名';
```

### Q: 如何回滚？
**A**: 如果需要回到之前的状态，执行：

```sql
-- 删除新策略
DROP POLICY IF EXISTS "Users can view own records" ON practice_records;
DROP POLICY IF EXISTS "Users can insert own records" ON practice_records;
DROP POLICY IF EXISTS "Users can update own records" ON practice_records;
DROP POLICY IF EXISTS "Users can delete own records" ON practice_records;

-- 恢复旧策略
CREATE POLICY "Enable all operations for all users" ON practice_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 删除字段（可选，不建议）
-- ALTER TABLE practice_records DROP COLUMN user_id;
```

---

## 获取帮助

如果仍有问题：
1. 检查 Supabase Dashboard 的日志
2. 查看 `DATABASE_MIGRATION.md` 详细说明
3. 确保使用的是 service role key 或 Supabase Dashboard 的 SQL Editor

**最简单的方法**：直接使用 `add-user-id-to-practice-records-safe.sql`，一键解决所有问题！
