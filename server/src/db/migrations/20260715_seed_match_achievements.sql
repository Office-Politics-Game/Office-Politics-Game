INSERT INTO achievements (code, name, description, category, reward_currency, reward_amount)
VALUES
  ('first_match', '初入職場', '完成第一場職場角力。', 'match', NULL, 0),
  ('first_win', '職場勝利組', '贏得第一場職場角力。', 'match', NULL, 0)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  reward_currency = EXCLUDED.reward_currency,
  reward_amount = EXCLUDED.reward_amount,
  updated_at = CURRENT_TIMESTAMP;