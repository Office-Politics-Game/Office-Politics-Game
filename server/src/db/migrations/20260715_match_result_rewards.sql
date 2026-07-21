ALTER TABLE match_participants
ADD COLUMN IF NOT EXISTS exp_gained INTEGER NOT NULL DEFAULT 0 CHECK (exp_gained >= 0),
ADD COLUMN IF NOT EXISTS coins_gained INTEGER NOT NULL DEFAULT 0 CHECK (coins_gained >= 0);

ALTER TABLE player_achievements
ADD COLUMN IF NOT EXISTS source_match_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'player_achievements_source_match_id_fkey'
      AND conrelid = 'player_achievements'::regclass
  ) THEN
    ALTER TABLE player_achievements
    ADD CONSTRAINT player_achievements_source_match_id_fkey
    FOREIGN KEY (source_match_id)
    REFERENCES matches(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS player_achievements_source_match_idx
ON player_achievements(source_match_id, player_id);
