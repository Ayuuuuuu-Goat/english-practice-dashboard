#!/bin/bash

echo "🧹 清理重复播客"
echo "════════════════════════════════════════"
echo ""

# 1. 查看重复情况
echo "📊 检查重复情况..."
curl -s http://localhost:3000/api/podcasts/cleanup-duplicates | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'总播客数: {data[\"total\"]}')
print(f'唯一标题: {data[\"unique\"]}')
print(f'重复组数: {data[\"duplicates\"]}')
if data['duplicates'] > 0:
    print('\n重复的播客:')
    for dup in data['details']:
        print(f'  📋 {dup[\"title\"]} (重复 {dup[\"count\"]} 次)')
"

echo ""
echo "════════════════════════════════════════"
echo ""

# 2. 询问是否清理
read -p "是否清理重复数据? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "🗑️  正在清理..."
    curl -X POST http://localhost:3000/api/podcasts/cleanup-duplicates | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['success']:
    print(f'✅ 清理完成!')
    print(f'   删除: {data[\"deleted\"]} 个')
    print(f'   保留: {data[\"remaining\"]} 个')
else:
    print(f'❌ 清理失败: {data.get(\"error\", \"未知错误\")}')
"
    echo ""
    echo "✅ 完成！刷新浏览器查看结果"
else
    echo ""
    echo "⏭️  跳过清理"
fi

echo ""
echo "════════════════════════════════════════"
