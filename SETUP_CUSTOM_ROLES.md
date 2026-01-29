# 设置自定义角色功能

自定义角色功能需要在Supabase数据库中创建一个新表。请按照以下步骤操作：

## 步骤 1: 打开 Supabase SQL Editor

访问：https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou/editor

## 步骤 2: 执行以下 SQL

复制并粘贴以下SQL代码到SQL编辑器中，然后点击"Run"按钮：

```sql
-- 创建自定义角色表
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);

-- 启用行级安全
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Anyone can create custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Anyone can delete custom roles" ON custom_roles;

-- 创建策略：允许所有人读取
CREATE POLICY "Anyone can view custom roles" ON custom_roles
  FOR SELECT
  USING (true);

-- 创建策略：允许所有人插入
CREATE POLICY "Anyone can create custom roles" ON custom_roles
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人删除
CREATE POLICY "Anyone can delete custom roles" ON custom_roles
  FOR DELETE
  USING (true);
```

## 步骤 3: 验证

执行成功后，你应该能在左侧的表列表中看到 `custom_roles` 表。

## 完成！

现在你可以：
- ✅ 创建自定义角色，数据会保存到Supabase
- ✅ 在任何浏览器和设备上看到相同的角色列表
- ✅ 删除自定义角色，更改会同步到所有设备

## 功能说明

- **跨设备同步**：自定义角色保存在云端数据库，不再是本地localStorage
- **持久化存储**：角色数据永久保存，不会丢失
- **多人共享**：所有人都能看到创建的角色（适合团队使用）
