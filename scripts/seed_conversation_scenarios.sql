-- Seed data for AI Conversation Scenarios

-- 1. Technical Interview Scenario
DO $$
DECLARE
  interview_scenario_id UUID;
  start_node_id UUID;
  question1_node_id UUID;
  question2_pos_node_id UUID;
  question2_neg_node_id UUID;
  question3_node_id UUID;
  success_node_id UUID;
  neutral_node_id UUID;
  fail_node_id UUID;
BEGIN
  -- Create scenario
  INSERT INTO ai_conversation_scenarios (scenario_type, title, description, icon, difficulty, initial_context)
  VALUES (
    'interview',
    'Technical Interview',
    'You are interviewing for a Senior Software Engineer position at a tech company.',
    '🎯',
    'hard',
    'You are sitting in the interview room. The interviewer is reviewing your resume and about to ask technical questions.'
  )
  RETURNING id INTO interview_scenario_id;

  -- Start node (AI greeting)
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'start', 'ai', 'Good morning! Thank you for coming in today. I''ve reviewed your resume and I''m impressed with your background. Let''s start with a simple question: Can you tell me about your most challenging project?', 'interviewer')
  RETURNING id INTO start_node_id;

  -- Question 1 response options
  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (start_node_id, 'I work on microservices project last year. It was very challenge.', 30, 'Use past tense: "worked on" instead of "work on". "challenging" not "challenge".', 'I worked on a microservices project last year. It was very challenging.', 'question2_negative', 'negative'),
    (start_node_id, 'I worked on a large-scale microservices migration project where I led a team of 5 engineers.', 90, 'Excellent! Clear and professional.', NULL, 'question2_positive', 'positive'),
    (start_node_id, 'Um... I think... maybe the project about backend?', 10, 'Too vague and uncertain. Be specific and confident.', 'The most challenging project was redesigning our backend architecture.', 'question2_negative', 'negative');

  -- Question 2 (positive path) - AI asks follow-up
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'question2_positive', 'ai', 'That sounds impressive! What was the biggest technical challenge you faced, and how did you overcome it?', 'interviewer')
  RETURNING id INTO question2_pos_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question2_pos_node_id, 'The challenge was database performance. I implement caching strategy and optimize queries, reduce latency by 60%.', 60, 'Use past tense: "implemented" and "optimized". Add article: "a caching strategy".', 'The challenge was database performance. I implemented a caching strategy and optimized queries, reducing latency by 60%.', 'question3', 'positive'),
    (question2_pos_node_id, 'We had severe performance bottlenecks. I analyzed the system, implemented Redis caching, optimized database queries, and reduced response time from 2s to 300ms.', 95, 'Perfect! Specific metrics and clear structure.', NULL, 'question3', 'positive'),
    (question2_pos_node_id, 'It was hard... many problems...', 5, 'Too vague. Provide specific technical details and solutions.', 'The main challenge was managing data consistency across services. I implemented event sourcing to solve this.', 'question3', 'negative');

  -- Question 2 (negative path)
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'question2_negative', 'ai', 'I see. Let me ask something more specific: How do you ensure code quality in your team?', 'interviewer')
  RETURNING id INTO question2_neg_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question2_neg_node_id, 'We have code review.', 20, 'Too brief. Elaborate on your process.', 'We conduct thorough code reviews, use automated testing, and enforce coding standards through CI/CD pipelines.', 'question3', 'neutral'),
    (question2_neg_node_id, 'We enforce strict code review processes, maintain 80%+ test coverage, use ESLint and Prettier for consistency, and run automated tests in our CI/CD pipeline.', 85, 'Excellent detail and structure!', NULL, 'question3', 'positive'),
    (question2_neg_node_id, 'I don''t know... just write code carefully?', 0, 'Unprofessional and shows lack of experience. Describe specific practices.', 'We follow industry best practices including peer reviews, automated testing, and continuous integration.', 'fail', 'negative');

  -- Question 3 (final question)
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'question3', 'ai', 'Great! One last question: Where do you see yourself in 3 years?', 'interviewer')
  RETURNING id INTO question3_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question3_node_id, 'I want to become a tech lead or architect, mentor junior developers, and contribute to important technical decisions.', 90, 'Perfect! Clear career vision.', NULL, 'success', 'positive'),
    (question3_node_id, 'I hope I can be tech lead.', 40, 'Use more confident language: "I aim to become" instead of "I hope".', 'I aim to become a tech lead, driving technical excellence and mentoring team members.', 'neutral', 'neutral'),
    (question3_node_id, 'Maybe working here? I don''t know.', 10, 'Shows lack of ambition and planning. Have a clear career vision.', 'I plan to deepen my technical expertise and take on leadership responsibilities.', 'neutral', 'neutral');

  -- Success ending
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'success', 'ai', 'Excellent answers! Your technical depth and communication skills are outstanding. We''d like to move forward with an offer. Welcome to the team!', 'interviewer')
  RETURNING id INTO success_node_id;

  -- Neutral ending
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'neutral', 'ai', 'Thank you for your time. Your answers show potential, but we need someone with stronger communication skills. We''ll be in touch.', 'interviewer')
  RETURNING id INTO neutral_node_id;

  -- Fail ending
  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (interview_scenario_id, 'fail', 'ai', 'I appreciate you coming in today. Unfortunately, we don''t think this is the right fit at this time.', 'interviewer')
  RETURNING id INTO fail_node_id;
END $$;

-- 2. Meeting with Boss Scenario
DO $$
DECLARE
  meeting_scenario_id UUID;
  start_node_id UUID;
  question1_node_id UUID;
  question2_pos_node_id UUID;
  question2_neg_node_id UUID;
  promotion_node_id UUID;
  neutral_node_id UUID;
  fail_node_id UUID;
BEGIN
  INSERT INTO ai_conversation_scenarios (scenario_type, title, description, icon, difficulty, initial_context)
  VALUES (
    'meeting',
    'Team Meeting Discussion',
    'You are in a meeting with your manager to discuss the project roadmap for Q2.',
    '👔',
    'medium',
    'Your boss called a meeting to discuss the upcoming quarter. This could be an opportunity to propose your ideas.'
  )
  RETURNING id INTO meeting_scenario_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'start', 'ai', 'Thanks for joining me. I wanted to discuss our Q2 priorities. What do you think should be our main focus?', 'boss')
  RETURNING id INTO start_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (start_node_id, 'I think we should focus improving performance and add new features for customer.', 50, 'Missing "on" after "focus". Add article: "the customer" or "customers".', 'I think we should focus on improving performance and adding new features for customers.', 'question2_neutral', 'neutral'),
    (start_node_id, 'Based on customer feedback and market trends, I propose we prioritize API performance optimization and the new dashboard feature. This aligns with our 20% growth target.', 95, 'Excellent! Data-driven and strategic.', NULL, 'question2_positive', 'positive'),
    (start_node_id, 'Whatever you think is good.', 5, 'Shows no initiative. Managers value proactive thinking.', 'I''d like to suggest focusing on performance optimization, as it directly impacts user satisfaction.', 'question2_negative', 'negative');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'question2_positive', 'ai', 'I love your strategic thinking! How would you lead this initiative?', 'boss')
  RETURNING id INTO question2_pos_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question2_pos_node_id, 'I can setting up weekly sync meetings, define clear KPIs, and coordinate with design and backend teams.', 60, 'Use "set up" not "setting up" after "can".', 'I can set up weekly sync meetings, define clear KPIs, and coordinate with design and backend teams.', 'promotion', 'positive'),
    (question2_pos_node_id, 'I''d create a project plan with milestones, assign tasks based on team strengths, establish metrics for success, and provide weekly progress reports.', 100, 'Perfect leadership answer!', NULL, 'promotion', 'positive');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'question2_neutral', 'ai', 'Okay, that makes sense. Can you put together a proposal by end of week?', 'boss')
  RETURNING id INTO question2_neg_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question2_neg_node_id, 'Yes, I will prepare detailed proposal with timeline and resource estimation.', 70, 'Add article: "a detailed proposal".', 'Yes, I will prepare a detailed proposal with timeline and resource estimation.', 'neutral', 'neutral'),
    (question2_neg_node_id, 'Absolutely! I''ll include scope, timeline, resources needed, risk assessment, and expected outcomes.', 90, 'Great! Comprehensive and professional.', NULL, 'neutral', 'positive');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'question2_negative', 'ai', 'I need someone who can take ownership. Do you have any concrete suggestions?', 'boss')
  RETURNING id INTO start_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (start_node_id, 'Let me think about it and get back to you with specific recommendations.', 60, 'Good recovery, but could be more specific.', 'Let me analyze the data and present three prioritized recommendations by tomorrow.', 'neutral', 'neutral'),
    (start_node_id, 'Sorry, I don''t have ideas now.', 0, 'Unprofessional. Always come to meetings prepared.', 'I apologize for not being prepared. I''ll research and present a proposal within 24 hours.', 'fail', 'negative');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'promotion', 'ai', 'Impressive! Your strategic thinking and leadership potential are exactly what we need. I''d like to discuss a promotion to Senior Engineer with you. Congratulations!', 'boss')
  RETURNING id INTO promotion_node_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'neutral', 'ai', 'Good. Let''s sync up next week to review your proposal. Keep up the good work.', 'boss')
  RETURNING id INTO neutral_node_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (meeting_scenario_id, 'fail', 'ai', 'I''m concerned about your preparedness. Let''s revisit this conversation when you''re ready.', 'boss')
  RETURNING id INTO fail_node_id;
END $$;

-- 3. Project Report Scenario
DO $$
DECLARE
  report_scenario_id UUID;
  start_node_id UUID;
  question1_node_id UUID;
  raise_node_id UUID;
  neutral_node_id UUID;
BEGIN
  INSERT INTO ai_conversation_scenarios (scenario_type, title, description, icon, difficulty, initial_context)
  VALUES (
    'reporting',
    'Project Status Report',
    'You need to report on the current project status to stakeholders.',
    '📊',
    'medium',
    'The monthly stakeholder meeting is happening. You need to present your project''s progress and address concerns.'
  )
  RETURNING id INTO report_scenario_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (report_scenario_id, 'start', 'ai', 'Thanks for the update. I see we''re slightly behind schedule. What''s causing the delay?', 'stakeholder')
  RETURNING id INTO start_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (start_node_id, 'The delay is because we found some technical debt need to address first for long-term stability.', 60, 'Missing "that" before "need". Use "needs" (singular).', 'The delay is because we found technical debt that needs to be addressed first for long-term stability.', 'question1', 'neutral'),
    (start_node_id, 'We encountered unexpected technical debt in the authentication module. Addressing it now will prevent security issues and save 3 weeks later. I''ve adjusted the timeline accordingly.', 95, 'Excellent! Transparent, specific, with business justification.', NULL, 'question1', 'positive'),
    (start_node_id, 'There are some problems... the team is working on it.', 10, 'Too vague. Stakeholders need specific information.', 'We discovered critical technical debt that required immediate attention to ensure system reliability.', 'question1', 'negative');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (report_scenario_id, 'question1', 'ai', 'I appreciate your transparency. When can we expect the project to be back on track?', 'stakeholder')
  RETURNING id INTO question1_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question1_node_id, 'We will finish by end of month. I add two developers to speed up.', 50, 'Use "the end" and past tense "added".', 'We will finish by the end of the month. I added two developers to accelerate progress.', 'neutral', 'neutral'),
    (question1_node_id, 'We''ll complete the technical debt resolution by Friday and resume normal velocity next sprint. The revised delivery date is March 15th, with a 2-day buffer for QA.', 100, 'Perfect! Specific dates, clear plan, includes buffer.', NULL, 'raise', 'positive'),
    (question1_node_id, 'Soon... maybe next month?', 5, 'Unprofessional uncertainty. Provide concrete dates.', 'I''ll finalize the updated timeline and share it by end of day today.', 'neutral', 'neutral');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (report_scenario_id, 'raise', 'ai', 'Outstanding project management and communication! Your proactive approach saved us from major issues. We''re approving a 15% raise for you. Well done!', 'stakeholder')
  RETURNING id INTO raise_node_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (report_scenario_id, 'neutral', 'ai', 'Alright, keep me posted on progress. Let''s sync again next week.', 'stakeholder')
  RETURNING id INTO neutral_node_id;
END $$;

-- 4. Client Negotiation Scenario
DO $$
DECLARE
  negotiation_scenario_id UUID;
  start_node_id UUID;
  question1_node_id UUID;
  success_node_id UUID;
  neutral_node_id UUID;
BEGIN
  INSERT INTO ai_conversation_scenarios (scenario_type, title, description, icon, difficulty, initial_context)
  VALUES (
    'negotiation',
    'Client Negotiation',
    'A potential client wants to negotiate the project scope and budget.',
    '🤝',
    'hard',
    'The client loves your proposal but thinks the price is too high. You need to defend your value while keeping them engaged.'
  )
  RETURNING id INTO negotiation_scenario_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (negotiation_scenario_id, 'start', 'ai', 'Your proposal looks great, but the budget is 30% higher than we expected. Can you work within our budget?', 'client')
  RETURNING id INTO start_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (start_node_id, 'The price is based on scope and quality. Maybe we can reduce some features to meet your budget?', 70, 'Good approach but could be more consultative.', 'I understand budget constraints. Let''s review the scope together - what are your must-have vs nice-to-have features?', 'question1', 'positive'),
    (start_node_id, 'I understand. Let''s explore options: we can phase the project, prioritize core features for phase 1, or adjust technical complexity. What''s your ideal budget range?', 95, 'Excellent! Consultative, offers solutions, asks for information.', NULL, 'question1', 'positive'),
    (start_node_id, 'Sorry, we cannot change the price.', 5, 'Too rigid. Negotiation requires flexibility and creativity.', 'I''d like to understand your budget constraints better so we can find a solution that works for both of us.', 'question1', 'negative');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (negotiation_scenario_id, 'question1', 'ai', 'We absolutely need the user authentication and dashboard features. Could we defer the analytics module to phase 2?', 'client')
  RETURNING id INTO question1_node_id;

  INSERT INTO conversation_response_options (node_id, option_text, quality_score, grammar_feedback, better_expression, next_node_id, outcome_effect)
  VALUES
    (question1_node_id, 'Yes, that is good solution. Phase 1 will be authentication and dashboard. We can do analytics later.', 70, 'Add article: "a good solution". Use "can implement" instead of "can do".', 'Yes, that''s a great solution. Phase 1 will include authentication and dashboard. We can implement analytics in phase 2.', 'success', 'positive'),
    (question1_node_id, 'Perfect! Let me create a revised proposal: Phase 1 with auth and dashboard at $50K, 8 weeks. Phase 2 with analytics at $25K, 4 weeks. This fits your budget and delivers value incrementally.', 100, 'Outstanding! Specific numbers, timeline, shows value.', NULL, 'success', 'positive'),
    (question1_node_id, 'I guess so... whatever you want.', 0, 'Unprofessional and passive. Show enthusiasm and partnership.', 'Absolutely! This phased approach will deliver immediate value while managing costs effectively.', 'neutral', 'neutral');

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (negotiation_scenario_id, 'success', 'ai', 'Excellent! I love this approach. You''ve shown flexibility while protecting quality. Let''s move forward with the contract. This will be a great partnership!', 'client')
  RETURNING id INTO success_node_id;

  INSERT INTO conversation_dialogue_nodes (scenario_id, node_id, speaker, content, character_role)
  VALUES (negotiation_scenario_id, 'neutral', 'ai', 'Okay, I''ll need to discuss this with my team and get back to you. Thanks for your time.', 'client')
  RETURNING id INTO neutral_node_id;
END $$;
