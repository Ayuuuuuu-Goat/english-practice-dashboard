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

-- 创建策略：允许所有人读取
CREATE POLICY "Anyone can view custom roles" ON custom_roles
  FOR SELECT
  USING (true);

-- 创建策略：允许所有人插入（简化版，实际应该加权限控制）
CREATE POLICY "Anyone can create custom roles" ON custom_roles
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人删除
CREATE POLICY "Anyone can delete custom roles" ON custom_roles
  FOR DELETE
  USING (true);
