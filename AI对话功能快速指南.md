# AI 场景对话功能 - 快速上手指南

## 功能简介

这是一个**游戏化的英语对话练习功能**，就像玩对话游戏一样！

特点：
- 🎯 **4个真实职场场景**：技术面试、团队会议、项目汇报、客户谈判
- 🎮 **游戏式对话**：选择对话选项，不需要打字
- 📈 **实时评分反馈**：每个选择都有分数和改进建议
- 🏆 **多种结局**：升职、加薪、交易成功等

## 快速开始（3 步）

### 步骤 1: 设置数据库

打开 Supabase Dashboard，在 SQL Editor 中依次运行：

1. `scripts/create_ai_conversation_tables.sql` （创建表）
2. `scripts/seed_conversation_scenarios.sql` （导入场景数据）

### 步骤 2: 重启服务器

```bash
npm run dev
```

### 步骤 3: 开始使用

1. 打开 http://localhost:3000
2. 登录账号
3. 点击侧边栏 "AI 场景对话"
4. 选择场景，开始对话！

## 如何玩

### 1. 选择场景

四个场景任你选：
- 🎯 **技术面试** (困难) - 能拿到 offer 吗？
- 👔 **团队会议** (中等) - 能获得晋升吗？
- 📊 **项目汇报** (中等) - 能拿到加薪吗？
- 🤝 **客户谈判** (困难) - 能成功签单吗？

### 2. 进行对话

- AI 扮演角色（面试官、老板、客户等）
- 你看到 2-3 个对话选项
- **点击选项**（不用打字！）
- 立即看到反馈：
  - ✅ 这句话的质量分数
  - 📝 语法错误提示
  - 💡 更好的表达方式
  - 📈 对剧情的影响（积极/中性/消极）

### 3. 触发结局

根据你的选择，会触发不同结局：

**最佳结局** 🏆
- 面试：获得 Offer
- 会议：获得晋升
- 汇报：获得 15% 加薪
- 谈判：签订合同

**普通结局** ✅
- 表现还行，但没有特别奖励

**失败结局** ❌
- 需要改进，再试一次

## 示例对话

### 场景：技术面试

**面试官**：Can you tell me about your most challenging project?

**你的选择**：

A. "I work on microservices project last year. It was very challenge."
   - 评分：+30 分
   - 反馈：语法错误 - 应该用 "worked"，"challenging"
   - 影响：消极（导向失败路线）

B. "I worked on a large-scale microservices migration project where I led a team of 5 engineers."
   - 评分：+90 分
   - 反馈：完美！专业且具体
   - 影响：积极（导向成功路线）

C. "Um... I think... maybe the project about backend?"
   - 评分：+10 分
   - 反馈：太模糊，不自信
   - 影响：消极（导向失败路线）

**选择 B 后，面试官会继续深入提问，你离 offer 更近了！**

## 评分系统

总分 = 所有回合的质量分数之和（最高约 300 分）

- **250-300 分**：最佳表现 → 最好结局
- **150-249 分**：中等表现 → 普通结局
- **0-149 分**：需要改进 → 失败结局

## 统计数据

主界面会显示：
- 📊 总对话次数
- ✅ 完成对话次数
- 📈 平均得分
- 🏆 获得最佳结局次数

## 学习建议

### 如何提高分数

1. **选择具体的回答**
   - ❌ "I did some projects"
   - ✅ "I led a 6-month migration project that reduced costs by 30%"

2. **使用专业表达**
   - ❌ "I think maybe we can do it"
   - ✅ "I propose we implement this solution"

3. **展现自信**
   - ❌ "I don't know... um..."
   - ✅ "Based on my experience, I recommend..."

4. **提供数据支持**
   - ❌ "The project went well"
   - ✅ "We reduced latency from 2s to 300ms, improving user satisfaction by 40%"

### 学习策略

1. **第一遍**：凭直觉选择，看看能到达什么结局
2. **第二遍**：尝试不同选项，对比反馈
3. **第三遍**：应用学到的表达，争取最佳结局
4. **实战应用**：在真实工作中使用学到的表达

## 技巧提示

### 面试技巧
- 使用 STAR 法（Situation, Task, Action, Result）
- 提供具体的项目数据和成果
- 展现技术深度和领导力

### 会议技巧
- 主动提出建议
- 基于数据做决策
- 展现战略思维

### 汇报技巧
- 透明沟通问题
- 提供解决方案和时间表
- 包含风险评估和缓冲时间

### 谈判技巧
- 理解客户需求
- 提供多种方案
- 展现灵活性和专业性

## 常见问题

**Q: 我能重复玩同一个场景吗？**
A: 可以！每次可以尝试不同选择，触发不同结局。

**Q: 语法反馈在哪里？**
A: 选择选项后，会在你的消息气泡下方展开显示。

**Q: 分数会保存吗？**
A: 会！每次完成的对话都会记录，统计数据会更新。

**Q: 能自定义场景吗？**
A: 目前不支持，但我们计划在未来版本添加。

**Q: 我的最高分是多少？**
A: 理论最高分约 300 分（每个场景都选择最佳选项）。

## 文件位置

如果需要查看代码或修改：

- **主组件**: `components/ai-conversation/scenario-conversation-page.tsx`
- **API 路由**: `app/api/conversation/`
- **数据库脚本**: `scripts/create_ai_conversation_tables.sql` 和 `seed_conversation_scenarios.sql`
- **完整文档**: `AI_CONVERSATION_FEATURE.md`

## 获取帮助

遇到问题？

1. 检查浏览器控制台（F12）
2. 查看服务器日志
3. 确认数据库表已创建
4. 阅读 `AI_CONVERSATION_FEATURE.md` 故障排除部分

## 开始你的第一个对话吧！

祝你早日获得晋升和加薪！💪

---

Built with ❤️ for English learners
