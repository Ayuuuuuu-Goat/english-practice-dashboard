# 调试指南 - 总览无数据问题

## 快速诊断

### 步骤 1：检查浏览器控制台

1. 打开浏览器（Chrome/Safari/Firefox）
2. 按 `F12` 或 `Cmd+Option+I` (Mac) 打开开发者工具
3. 切换到 **Console** 标签
4. 刷新页面
5. 查看是否有红色错误信息

**常见错误及解决方案**：

#### 错误 1: `column "user_id" does not exist`
```
Error fetching practice records: {code: "42703", message: "column user_id does not exist"}
```

**原因**：数据库迁移还没执行

**解决方案**：
- 执行 `scripts/add-user-id-to-practice-records-safe.sql`
- 或者等待代码自动降级（应该能看到旧数据）

#### 错误 2: `relation "daily_practice_stats" does not exist`
```
Error fetching pronunciation stats: {code: "42P01"}
```

**原因**：发音训练表还没创建

**解决方案**：
- 这是正常的，表示你还没使用过发音训练功能
- 不影响手动记录的显示

#### 错误 3: `relation "user_video_checkins" does not exist`
```
Error fetching video checkins: {code: "42P01"}
```

**原因**：视频学习表还没创建

**解决方案**：
- 这是正常的，表示你还没使用过视频学习功能
- 不影响手动记录的显示

---

### 步骤 2：检查是否有数据

在 Supabase Dashboard 中查询：

```sql
-- 检查是否有任何记录
SELECT * FROM practice_records LIMIT 10;
```

**结果分析**：

#### 情况 A：没有任何记录
```
(空结果)
```

**这是正常的！** 新账号没有数据。

**解决方案**：
- 点击首页的"新增记录"按钮
- 添加一条测试记录
- 应该立即显示

#### 情况 B：有记录但 user_id 是 NULL
```
id    | member_name | date       | user_id
------|-------------|------------|----------
uuid1 | test_user   | 2026-01-27 | NULL
```

**原因**：这是迁移前的旧数据

**解决方案**：为记录分配 user_id

```sql
-- 查看 gina 用户的 ID
SELECT id, email FROM auth.users WHERE email = 'gina@test.com';
-- 假设返回: 85ae1820-b45d-4bd6-b4e4-08ce03251145

-- 为记录分配 user_id
UPDATE practice_records
SET user_id = '85ae1820-b45d-4bd6-b4e4-08ce03251145'
WHERE user_id IS NULL;
```

#### 情况 C：有记录且 user_id 正确
```
id    | member_name | date       | user_id
------|-------------|------------|----------
uuid1 | gina        | 2026-01-27 | 85ae1820...
```

**这很好！** 但前端看不到数据。

**可能原因**：
- RLS 策略有问题
- 前端代码有 bug

**解决方案**：继续下面的步骤

---

### 步骤 3：检查 RLS 策略

```sql
-- 查看策略
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'practice_records';
```

**期望结果**（应该有4个策略）：
```
policyname                    | cmd
------------------------------|--------
Users can view own records    | SELECT
Users can insert own records  | INSERT
Users can update own records  | UPDATE
Users can delete own records  | DELETE
```

**如果策略不正确**：
- 执行 `scripts/add-user-id-to-practice-records-safe.sql`

---

### 步骤 4：测试添加记录

1. 在首页点击"新增记录"
2. 填写：
   - 日期：今天
   - 时长：30
   - 备注：测试记录
3. 点击"提交"

**检查浏览器控制台**：
- 如果有错误，记录错误信息
- 如果没有错误，刷新页面查看

---

## 完整诊断脚本

在 Supabase SQL Editor 中执行：

```sql
-- 1. 检查表结构
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'practice_records'
ORDER BY ordinal_position;

-- 2. 检查用户
SELECT id, email FROM auth.users WHERE email = 'gina@test.com';

-- 3. 检查记录
SELECT id, member_name, date, duration, user_id, created_at
FROM practice_records
ORDER BY created_at DESC
LIMIT 5;

-- 4. 检查 NULL user_id 记录
SELECT COUNT(*) FROM practice_records WHERE user_id IS NULL;

-- 5. 检查 RLS 策略
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'practice_records';

-- 6. 检查其他表是否存在
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('daily_practice_stats', 'user_video_checkins');
```

将结果发给我，我可以帮你进一步诊断。

---

## 快速修复步骤

### 如果是新账号（没有数据）

**这是正常的！** 直接添加记录即可：

1. 点击"新增记录"
2. 填写信息并提交
3. 应该立即显示

### 如果数据库迁移还没执行

执行安全版本脚本：

```sql
-- 复制 scripts/add-user-id-to-practice-records-safe.sql 的内容
-- 粘贴到 Supabase SQL Editor
-- 点击 Run
```

### 如果有旧数据需要迁移

```sql
-- 为所有记录分配给 gina 用户
UPDATE practice_records
SET user_id = '85ae1820-b45d-4bd6-b4e4-08ce03251145'
WHERE user_id IS NULL;
```

---

## 联系支持

如果以上步骤都无法解决，请提供：

1. 浏览器控制台的错误截图
2. Supabase 查询结果
3. 当前使用的账号邮箱

我会帮你具体分析问题。

---

## 常见场景总结

| 症状 | 原因 | 解决方案 |
|------|------|----------|
| 首页完全空白 | 新账号没数据 | 添加记录 |
| 控制台报 42703 错误 | user_id 字段不存在 | 执行迁移脚本 |
| 有旧数据但看不到 | user_id 是 NULL | UPDATE 设置 user_id |
| 添加记录后看不到 | RLS 策略错误 | 重新创建策略 |
| 某些表不存在 | 功能表未创建 | 正常，使用对应功能后会创建 |
