CREATE TABLE IF NOT EXISTS match_participants (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  username_snapshot VARCHAR(50) NOT NULL,
  avatar_id_snapshot INTEGER,
  round_wins INTEGER NOT NULL DEFAULT 0 CHECK (round_wins >= 0),
  result VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (result IN ('win', 'lose')),
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS match_participants_player_idx
ON match_participants(player_id, match_id);

CREATE INDEX IF NOT EXISTS match_participants_match_idx
ON match_participants(match_id);