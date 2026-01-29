# AI 场景对话功能 (AI Scenario Conversation Feature)

## 功能概述 (Feature Overview)

这是一个游戏化的英语对话练习功能，模拟真实工作场景（面试、会议、汇报、谈判），通过选择对话选项触发不同剧情和结局。

This is a gamified English conversation practice feature that simulates real work scenarios (interview, meeting, reporting, negotiation), triggering different storylines and endings through dialogue choices.

## 核心特性 (Core Features)

### 1. 四大职场场景 (4 Career Scenarios)

#### 🎯 技术面试 (Technical Interview)
- **难度**: 困难 (Hard)
- **角色**: 面试官 (Interviewer)
- **可能结局**:
  - ✅ 获得 Offer (Get Job Offer)
  - 😐 需要改进 (Needs Improvement)
  - ❌ 面试失败 (Interview Failed)

#### 👔 团队会议 (Team Meeting)
- **难度**: 中等 (Medium)
- **角色**: 老板 (Boss)
- **可能结局**:
  - 🎉 获得晋升 (Get Promotion)
  - ✅ 顺利完成 (Completed Successfully)
  - ❌ 表现不佳 (Poor Performance)

#### 📊 项目汇报 (Project Report)
- **难度**: 中等 (Medium)
- **角色**: 利益相关方 (Stakeholder)
- **可能结局**:
  - 💰 获得加薪 15% (Get 15% Raise)
  - ✅ 顺利汇报 (Successful Report)

#### 🤝 客户谈判 (Client Negotiation)
- **难度**: 困难 (Hard)
- **角色**: 客户 (Client)
- **可能结局**:
  - 🤝 交易成功 (Deal Success)
  - 😐 客户考虑中 (Client Considering)

### 2. 游戏化对话系统 (Gamified Dialogue System)

- **选项选择**: 不需要输入完整文本，选择预设对话选项
  - **Option Selection**: No need to type full text, choose preset dialogue options

- **分支剧情**: 不同选择导向不同的对话路径和结局
  - **Branching Storylines**: Different choices lead to different dialogue paths and endings

- **实时反馈**: 选择后立即显示：
  - **Real-time Feedback**: Immediately displays after selection:
  - ✅ 质量评分 (Quality Score): +0 to +100
  - 📝 语法建议 (Grammar Feedback)
  - 💡 更好的表达 (Better Expression)
  - 📈 影响效果 (Outcome Effect): 积极/中性/消极

### 3. 智能评分系统 (Smart Scoring System)

每个回复选项都有质量评分，影响最终结局：

Each response option has a quality score affecting the final outcome:

- **高质量回复** (90-100分): 专业、具体、有数据支持
  - **High Quality** (90-100 points): Professional, specific, data-backed
- **中等回复** (40-70分): 基本正确但不够详细或有语法错误
  - **Medium Quality** (40-70 points): Basically correct but lacks detail or has grammar errors
- **低质量回复** (0-30分): 模糊、不专业、语法错误多
  - **Low Quality** (0-30 points): Vague, unprofessional, many grammar errors

### 4. 学习增强 (Learning Enhancement)

每个选项都包含：

Each option includes:

- **语法纠正**: 指出错误并提供正确表达
  - **Grammar Correction**: Points out errors and provides correct expressions
- **更好的表达**: 提供更地道、更专业的说法
  - **Better Expression**: Provides more native and professional alternatives
- **影响说明**: 说明这个选择对对话走向的影响
  - **Impact Explanation**: Explains how this choice affects conversation direction

## 数据库架构 (Database Schema)

### 表结构 (Table Structure)

1. **ai_conversation_scenarios** - 对话场景
   - 场景类型、标题、描述、难度、初始背景

2. **conversation_dialogue_nodes** - 对话节点
   - 场景ID、节点ID、说话人、内容、角色

3. **conversation_response_options** - 回复选项
   - 节点ID、选项文本、质量评分、语法反馈、更好的表达、下一节点、影响效果

4. **user_conversation_progress** - 用户进度
   - 用户ID、场景ID、当前节点、对话历史、总分、是否完成、最终结局

5. **conversation_session_results** - 会话结果
   - 用户ID、场景ID、各项评分、最终结局、反馈总结

## 安装步骤 (Installation Steps)

### 1. 运行数据库迁移 (Run Database Migrations)

有两种方式：

**方式 1: 使用 Supabase Dashboard (推荐)**

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 依次运行以下 SQL 文件：
   - `scripts/create_ai_conversation_tables.sql`
   - `scripts/seed_conversation_scenarios.sql`

**方式 2: 使用命令行**

```bash
# 设置环境变量
export SUPABASE_URL='your_supabase_db_url'
export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'

# 运行设置脚本
cd /Users/takanoriiwata/Downloads/english-practice-dashboard
./scripts/run_conversation_setup.sh
```

### 2. 重启开发服务器 (Restart Dev Server)

```bash
npm run dev
```

### 3. 访问功能 (Access Feature)

1. 打开浏览器访问 http://localhost:3000
2. 登录你的账号
3. 点击侧边栏的 "AI 场景对话" 标签
4. 选择一个场景开始练习！

## 使用指南 (Usage Guide)

### 开始对话 (Start Conversation)

1. 在主界面选择一个场景（面试、会议、汇报、谈判）
2. 阅读初始情境背景
3. AI 会以角色身份开始对话

### 进行对话 (During Conversation)

1. **阅读 AI 的问题或陈述**
2. **从 2-3 个预设选项中选择你的回复**
3. **查看即时反馈**：
   - 质量评分
   - 语法建议
   - 更好的表达
   - 对剧情的影响（积极/中性/消极）
4. **继续对话**直到到达结局

### 查看结果 (View Results)

对话结束后，你会看到：

- 🏆 **最终结局**: 晋升/加薪/交易成功/等
- 📊 **总分**: 0-300分
- 📈 **统计数据**: 更新在主界面

## API 端点 (API Endpoints)

### GET /api/conversation/scenarios/list
获取所有对话场景

**Response:**
```json
{
  "success": true,
  "scenarios": [
    {
      "id": "uuid",
      "scenario_type": "interview",
      "title": "Technical Interview",
      "description": "...",
      "icon": "🎯",
      "difficulty": "hard",
      "initial_context": "..."
    }
  ]
}
```

### POST /api/conversation/start-scenario
开始一个新的对话会话

**Request:**
```json
{
  "user_id": "uuid",
  "scenario_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "progress_id": "uuid",
  "current_node": { ... },
  "response_options": [ ... ]
}
```

### POST /api/conversation/progress
选择一个回复选项，推进对话

**Request:**
```json
{
  "progress_id": "uuid",
  "selected_option_id": "uuid",
  "current_score": 150
}
```

**Response (继续对话):**
```json
{
  "success": true,
  "is_completed": false,
  "next_node": { ... },
  "response_options": [ ... ]
}
```

**Response (对话结束):**
```json
{
  "success": true,
  "is_completed": true,
  "final_outcome": "promotion",
  "final_node": { ... },
  "total_score": 280
}
```

### GET /api/conversation/stats?user_id=xxx
获取用户统计数据

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_sessions": 10,
    "completed_sessions": 8,
    "average_score": 245.5,
    "best_outcome_count": 3
  }
}
```

## 技术栈 (Tech Stack)

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 文件结构 (File Structure)

```
/app/api/conversation/
├── scenarios/list/route.ts      # 获取场景列表
├── start-scenario/route.ts      # 开始对话
├── progress/route.ts            # 对话进度
└── stats/route.ts               # 用户统计

/components/ai-conversation/
├── scenario-conversation-page.tsx  # 主组件
└── ai-conversation-page.tsx        # 旧版本（已废弃）

/scripts/
├── create_ai_conversation_tables.sql  # 数据库表创建
├── seed_conversation_scenarios.sql    # 场景数据
└── run_conversation_setup.sh          # 设置脚本
```

## 扩展场景 (Extending Scenarios)

要添加新场景，需要：

### 1. 在数据库中添加场景数据

```sql
-- 创建新场景
INSERT INTO ai_conversation_scenarios
(scenario_type, title, description, icon, difficulty, initial_context)
VALUES
('new_type', 'New Scenario', 'Description', '🎨', 'medium', 'Context...');

-- 创建对话节点
INSERT INTO conversation_dialogue_nodes
(scenario_id, node_id, speaker, content, character_role)
VALUES ...;

-- 创建回复选项
INSERT INTO conversation_response_options
(node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
VALUES ...;
```

### 2. 设计对话流程图

```
start → question1 → question2 → ending
              ↓          ↓
         alt_path    bad_ending
```

### 3. 定义结局类型

在 `ScenarioConversationPage.tsx` 的 `getOutcomeMessage` 函数中添加新结局。

## 最佳实践 (Best Practices)

### 对话设计

1. **每个场景 3-5 轮对话**为佳，太长会失去吸引力
2. **提供 2-3 个选项**，不要太多以免选择困难
3. **质量评分要有差异**：优秀(90+), 中等(50-70), 差(0-30)
4. **语法反馈要具体**：指出错误并提供正确版本
5. **更好的表达要实用**：真正能在工作中使用的表达

### 用户体验

1. **即时反馈**：选择后立即显示评分和建议
2. **进度可视化**：显示分数进度条
3. **结局要有意义**：晋升、加薪等明确的奖励
4. **鼓励重玩**：不同选择导致不同结局

## 故障排除 (Troubleshooting)

### 问题 1: 无法加载场景

**原因**: 数据库表未创建或数据未导入

**解决**: 运行数据库迁移脚本

```bash
./scripts/run_conversation_setup.sh
```

### 问题 2: 选择选项后无反应

**原因**: API 路由未正确配置

**解决**: 检查浏览器控制台和服务器日志，确保 API 路由正确

### 问题 3: 统计数据显示为 0

**原因**: 还未完成任何对话

**解决**: 完成至少一个对话场景，统计数据会自动更新

## 未来改进 (Future Improvements)

- [ ] 添加更多场景（年度评审、离职谈话、跨部门合作）
- [ ] 支持自定义场景编辑器
- [ ] 添加语音输入和语音评估
- [ ] 实现排行榜和成就系统
- [ ] 支持多人对话场景
- [ ] AI 动态生成对话选项

## 贡献者 (Contributors)

Built with ❤️ by the English Mastery team and Claude Code.

## 许可证 (License)

MIT License
