# 部署步骤指南

## ✅ 已完成

1. ✅ 创建了 `.env.local` 文件，包含所有配置
2. ✅ Supabase URL: https://mgjiwtrumkcmbhruqbou.supabase.co
3. ✅ Vercel Blob Token 已配置

## 📋 待完成步骤（需要您手动操作）

### 步骤 1: 执行数据库 SQL（5分钟）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou/sql/new

2. 点击 **New Query** 或 **SQL Editor**

3. 复制以下文件的全部内容并粘贴到 SQL 编辑器：
   ```
   scripts/pronunciation-schema.sql
   ```

4. 点击 **Run** 按钮执行

5. 验证成功：执行以下查询检查表是否创建
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND (table_name LIKE '%pronunciation%' OR table_name = 'word_cards');
   ```

   应该看到 4 个表：
   - word_cards
   - pronunciation_attempts
   - user_pronunciation_settings
   - daily_practice_stats

### 步骤 2: 部署 Edge Function（10分钟）

由于无法通过命令行部署，您有两个选择：

#### 选项 A: 通过 Supabase Dashboard（推荐）

1. 打开: https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou/functions

2. 点击 **Create a new function**

3. 函数名称输入: `evaluate-pronunciation`

4. 将以下三个文件的内容合并粘贴到编辑器：

**主文件内容（index.ts）：**
```typescript
// 复制 supabase/functions/evaluate-pronunciation/index.ts 的全部内容
// 然后在顶部添加 signature.ts 和 iflytek-client.ts 的内容
```

5. 点击 **Deploy** 部署

#### 选项 B: 本地安装 Supabase CLI 后部署

```bash
# macOS 使用 Homebrew
brew install supabase/tap/supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref mgjiwtrumkcmbhruqbou

# 部署函数
supabase functions deploy evaluate-pronunciation
```

### 步骤 3: 配置 Edge Function 环境变量（5分钟）

1. 打开: https://supabase.com/dashboard/project/mgjiwtrumkcmbhruqbou/settings/functions

2. 点击 **Add secret** 或 **Environment variables**

3. 添加以下环境变量：

| Key | Value |
|-----|-------|
| `IFLYTEK_APPID` | `ga8b82c6` |
| `IFLYTEK_API_KEY` | `d3c7a90d332a3ee97bbc710dcf45c746` |
| `IFLYTEK_API_SECRET` | `7e4dbedce4d8353423b031572fb27d13` |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_xFlCgDeYjZUxTWHU_u0m9GK5MpFV0zJ6kALmRhKr3lRG4qP` |
| `SUPABASE_URL` | `https://mgjiwtrumkcmbhruqbou.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naml3dHJ1bWtjbWJocnVxYm91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc1NjgzNywiZXhwIjoyMDgwMzMyODM3fQ.T12oLmSY7_-rohMYtNEllfmZZSKkGmAhDXcgzi7rNLU` |

4. 点击 **Save** 保存

### 步骤 4: 启动项目测试（2分钟）

```bash
cd /Users/takanoriiwata/Downloads/english-practice-dashboard
pnpm dev
```

访问 http://localhost:3000，点击左侧菜单 **发音练习**

## 🧪 测试清单

完成上述步骤后，测试以下功能：

- [ ] 数据库表已创建（50个预设单词）
- [ ] Edge Function 已部署并可访问
- [ ] 环境变量已配置
- [ ] 本地项目可以运行
- [ ] 可以看到发音练习页面
- [ ] 可以点击录音按钮（会请求麦克风权限）
- [ ] 录音后可以上传和评测

## ❓ 如果遇到问题

### 问题 1: SQL 执行失败
- 检查是否有权限
- 尝试分段执行 SQL（先建表，再插入数据）

### 问题 2: Edge Function 部署失败
- 确认函数名称为 `evaluate-pronunciation`
- 检查代码是否完整
- 查看错误日志

### 问题 3: 录音上传失败
- 验证 Vercel Blob Token 是否正确
- 检查网络连接

## 📞 需要帮助？

如果在部署过程中遇到任何问题，请告诉我具体的错误信息，我会帮您解决！
