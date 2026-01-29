#!/bin/bash

echo "🎙️ 正在重新加载真实的英语播客..."
echo ""

# 重新调用API，这次会使用更新后的URL
curl -X POST http://localhost:3000/api/podcasts/seed-real-podcasts

echo ""
echo ""
echo "✅ 完成！现在刷新浏览器页面查看真实播客"
echo ""
echo "💡 提示："
echo "- 音频已更新为真实的技术播客"
echo "- 如果还是不满意，查看 FIX_HORSE_AUDIO.md 了解如何自定义"
