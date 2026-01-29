#!/bin/bash

# Script to set up the AI Conversation feature database tables and seed data

echo "Setting up AI Conversation feature database..."

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
    echo "Please run: export SUPABASE_URL='your_url' and export SUPABASE_SERVICE_ROLE_KEY='your_key'"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Step 1: Creating tables..."
psql "$SUPABASE_URL" < "$SCRIPT_DIR/create_ai_conversation_tables.sql"

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully"
else
    echo "❌ Error creating tables"
    exit 1
fi

echo ""
echo "Step 2: Seeding scenario data..."
psql "$SUPABASE_URL" < "$SCRIPT_DIR/seed_conversation_scenarios.sql"

if [ $? -eq 0 ]; then
    echo "✅ Scenarios seeded successfully"
else
    echo "❌ Error seeding scenarios"
    exit 1
fi

echo ""
echo "✅ AI Conversation feature setup completed!"
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Navigate to the 'AI 场景对话' tab in the dashboard"
echo "3. Start a conversation scenario!"
