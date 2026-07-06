CREATE TABLE IF NOT EXISTS room_invitations (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  inviter_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  invitee_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (inviter_player_id <> invitee_player_id),
  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_room_invitation
ON room_invitations(room_id, invitee_player_id)
WHERE status = 'pending';
