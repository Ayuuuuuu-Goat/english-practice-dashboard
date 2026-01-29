#!/bin/bash

echo "🧪 Testing 302.ai API..."
echo ""

curl -X POST https://api.302.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-BqwghmqWBtNPTbCVz99JFBUUQogViZPImcRxT0kVAW0oT8Lg" \
  -m 30 \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello in English"}],
    "max_tokens": 20
  }'

echo ""
echo ""
