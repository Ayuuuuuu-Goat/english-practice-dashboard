-- Clean up duplicate scenarios
-- Keep only the most recent version of each scenario type

-- Delete duplicate negotiation scenarios (keep most recent)
DELETE FROM ai_conversation_scenarios
WHERE scenario_type = 'negotiation'
  AND id NOT IN (
    SELECT id FROM ai_conversation_scenarios
    WHERE scenario_type = 'negotiation'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Delete duplicate interview scenarios (keep most recent)
DELETE FROM ai_conversation_scenarios
WHERE scenario_type = 'interview'
  AND id NOT IN (
    SELECT id FROM ai_conversation_scenarios
    WHERE scenario_type = 'interview'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Delete duplicate reporting scenarios (keep most recent)
DELETE FROM ai_conversation_scenarios
WHERE scenario_type = 'reporting'
  AND id NOT IN (
    SELECT id FROM ai_conversation_scenarios
    WHERE scenario_type = 'reporting'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Delete duplicate meeting scenarios (keep most recent)
DELETE FROM ai_conversation_scenarios
WHERE scenario_type = 'meeting'
  AND id NOT IN (
    SELECT id FROM ai_conversation_scenarios
    WHERE scenario_type = 'meeting'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Verify: Should show 4 scenarios (one of each type)
SELECT scenario_type, title, icon, difficulty, created_at
FROM ai_conversation_scenarios
ORDER BY difficulty, scenario_type;
