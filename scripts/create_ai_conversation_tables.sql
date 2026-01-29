-- AI Conversation Scenarios and Progress Tables

-- Table for conversation scenarios with branching dialogues
CREATE TABLE IF NOT EXISTS ai_conversation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_type TEXT NOT NULL, -- 'interview', 'meeting', 'reporting', 'negotiation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  initial_context TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for dialogue nodes in branching conversation tree
CREATE TABLE IF NOT EXISTS conversation_dialogue_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES ai_conversation_scenarios(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- e.g., 'start', 'question1', 'success_ending'
  speaker TEXT NOT NULL, -- 'ai' or 'user'
  content TEXT NOT NULL,
  character_role TEXT, -- e.g., 'interviewer', 'boss', 'client'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scenario_id, node_id)
);

-- Table for user response options at each dialogue node
CREATE TABLE IF NOT EXISTS conversation_response_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES conversation_dialogue_nodes(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  quality_score INTEGER NOT NULL, -- 0-100, affects final outcome
  grammar_feedback TEXT, -- AI feedback on grammar
  better_expression TEXT, -- Suggested improvement
  next_node_id TEXT NOT NULL, -- ID of next dialogue node
  outcome_effect TEXT, -- 'positive', 'neutral', 'negative'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking user conversation progress
CREATE TABLE IF NOT EXISTS user_conversation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES ai_conversation_scenarios(id) ON DELETE CASCADE,
  current_node_id TEXT NOT NULL,
  conversation_history JSONB DEFAULT '[]'::jsonb, -- Array of {node_id, option_selected, timestamp}
  total_score INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  final_outcome TEXT, -- 'promotion', 'raise', 'deal_success', 'neutral', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for completed conversation sessions with detailed results
CREATE TABLE IF NOT EXISTS conversation_session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES ai_conversation_scenarios(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  grammar_score INTEGER NOT NULL,
  expression_score INTEGER NOT NULL,
  outcome_score INTEGER NOT NULL,
  final_outcome TEXT NOT NULL,
  feedback_summary TEXT,
  conversation_history JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dialogue_nodes_scenario ON conversation_dialogue_nodes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_response_options_node ON conversation_response_options(node_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_scenario ON user_conversation_progress(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_session_results_user ON conversation_session_results(user_id);

-- Enable Row Level Security
ALTER TABLE ai_conversation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_dialogue_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_response_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_session_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Scenarios, nodes, and options are public (read-only)
CREATE POLICY "Scenarios are viewable by everyone"
  ON ai_conversation_scenarios FOR SELECT
  USING (true);

CREATE POLICY "Dialogue nodes are viewable by everyone"
  ON conversation_dialogue_nodes FOR SELECT
  USING (true);

CREATE POLICY "Response options are viewable by everyone"
  ON conversation_response_options FOR SELECT
  USING (true);

-- User progress is private
CREATE POLICY "Users can view their own progress"
  ON user_conversation_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_conversation_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_conversation_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_conversation_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Session results are private
CREATE POLICY "Users can view their own results"
  ON conversation_session_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
  ON conversation_session_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
