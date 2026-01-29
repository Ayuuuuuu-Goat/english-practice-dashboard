# 用户ID修复说明

## 问题描述

之前的代码中，发音训练和视频学习模块使用的是硬编码的匿名用户ID (`00000000-0000-0000-0000-000000000000`)，导致：

1. ❌ 所有用户的学习数据混在一起
2. ❌ 首页无法正确显示当前用户的发音训练和视频学习记录
3. ❌ 数据无法按用户隔离

## 已修复的文件

### 1. 视频学习模块
**文件**: `components/video-learning/daily-video-page.tsx`

**修改内容**:
- ✅ 导入 `createClient` 从 `@/lib/supabase`
- ✅ 使用 `supabase.auth.getUser()` 获取当前登录用户
- ✅ 使用实际用户ID替代硬编码的匿名ID
- ✅ 确保用户登录后才加载数据

**关键代码**:
```typescript
const [userId, setUserId] = useState<string>('')

useEffect(() => {
  const initUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }
  initUser()
}, [])
```

### 2. 发音训练 - 练习页面
**文件**: `components/pronunciation/pronunciation-practice-page.tsx`

**修改内容**:
- ✅ 导入 `createClient` 从 `@/lib/supabase`
- ✅ 在 `initializePractice` 中获取当前登录用户
- ✅ 使用实际用户ID进行练习记录
- ✅ 未登录时显示提示

**关键代码**:
```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  toast.error('请先登录')
  return
}

setUserId(user.id)
```

### 3. 发音训练 - 统计页面
**文件**: `components/pronunciation/pronunciation-stats.tsx`

**修改内容**:
- ✅ 导入 `createClient` 和 `toast`
- ✅ 在 `loadStats` 中获取当前登录用户
- ✅ 使用实际用户ID查询统计数据

---

## 功能验证

### 测试步骤

1. **登录测试账号**
   - 邮箱: gina@test.com
   - 密码: gina888

2. **测试发音训练**
   - 进入"发音训练"标签页
   - 完成一次发音练习
   - 查看统计页面，应该能看到数据
   - **返回首页**，应该能看到发音训练记录

3. **测试视频学习**
   - 进入"每日视频"标签页
   - 观看视频并打卡
   - **返回首页**，应该能看到视频学习记录

4. **验证数据整合**
   - 首页"练习记录"列表应该显示：
     - ✅ 手动添加的记录
     - ✅ 发音训练记录（自动）
     - ✅ 视频学习记录（自动）
   - 趋势图表应该包含所有数据的时长

---

## 数据显示格式

### 视频学习记录
```
日期: 2026-01-27
时长: 20分钟 (视频完整时长)
备注: 视频学习（已完成）：用户笔记内容
操作: - (不可编辑/删除)
```

**时长说明**:
- 使用视频的**完整时长** (`currentVideo.duration`)
- 打卡时默认记录为"已看完"
- 时长自动从秒转换为分钟显示

### 发音训练记录
```
日期: 2026-01-27
时长: 15分钟 (练习时长)
备注: 发音训练：完成 8/10 词，平均分 85.5
操作: - (不可编辑/删除)
```

**时长说明**:
- 使用 `total_duration_seconds / 60` 转换为分钟
- 从 `daily_practice_stats` 表获取

---

## 常见问题

### Q1: 为什么首页还是看不到发音/视频数据？
**A**: 可能的原因：
1. 数据库表还没创建（第一次使用时会自动创建）
2. 还没有进行过发音训练或视频学习
3. 数据库迁移还没执行（需要 `user_id` 字段）

**解决方案**:
- 先去对应模块完成一次练习
- 确保已执行数据库迁移脚本
- 刷新首页查看

### Q2: 视频学习时长是实际观看时长还是视频时长？
**A**: 是**视频的完整时长**。

代码中使用:
```typescript
watched_duration: currentVideo.duration  // 视频完整时长
```

这样设计是因为打卡即认为已看完整视频。

### Q3: 可以修改自动记录吗？
**A**: 不可以。自动记录是系统根据实际学习活动生成的，只读不可编辑。

如需修改：
- 发音训练数据 → 去"发音训练"模块
- 视频学习数据 → 去"每日视频"模块

---

## 数据流图

```
用户登录 (gina@test.com)
   ↓
获取用户ID (85ae1820-b45d-4bd6-b4e4-08ce03251145)
   ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  发音训练模块   │   视频学习模块   │   手动记录模块   │
└─────────────────┴─────────────────┴─────────────────┘
   ↓                  ↓                  ↓
   user_id关联        user_id关联        user_id关联
   ↓                  ↓                  ↓
daily_practice_stats  user_video_checkins  practice_records
   ↓                  ↓                  ↓
┌──────────────────────────────────────────────────────┐
│              首页数据整合 (fetchRecords)              │
│                                                       │
│  1. 查询 practice_records (user_id = 当前用户)       │
│  2. 查询 daily_practice_stats (user_id = 当前用户)   │
│  3. 查询 user_video_checkins (user_id = 当前用户)    │
│  4. 整合并按日期排序                                  │
└──────────────────────────────────────────────────────┘
   ↓
显示在首页趋势图表和记录列表
```

---

## 技术细节

### 用户ID获取
```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// user.id 就是当前登录用户的UUID
// 例如: 85ae1820-b45d-4bd6-b4e4-08ce03251145
```

### 数据查询
```typescript
// 只获取当前用户的数据
await supabase
  .from("user_video_checkins")
  .select("*")
  .eq("user_id", user.id)
```

### RLS 保护
数据库层面的 Row Level Security 确保：
- ✅ 用户只能看到自己的数据
- ✅ 即使前端有bug，也无法访问他人数据
- ✅ 强制的数据隔离

---

## 下一步

修复完成后：

1. **刷新页面**
   - 清除浏览器缓存（可选）
   - 重新加载应用

2. **完成学习活动**
   - 去发音训练模块练习
   - 去视频学习模块看视频

3. **验证整合**
   - 返回首页
   - 查看所有数据是否正确显示

---

## 总结

| 修改前 | 修改后 |
|--------|--------|
| ❌ 使用匿名用户ID | ✅ 使用实际登录用户ID |
| ❌ 数据混杂 | ✅ 数据按用户隔离 |
| ❌ 首页看不到自动记录 | ✅ 首页整合所有学习数据 |
| ❌ 无法追踪个人进度 | ✅ 准确追踪个人学习进度 |

现在，每个用户的学习数据都是独立的，首页可以完整展示所有学习活动！🎉
