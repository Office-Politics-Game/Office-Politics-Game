CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  avatar_id INTEGER,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  exp INTEGER NOT NULL DEFAULT 0 CHECK (exp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  tickets INTEGER NOT NULL DEFAULT 0 CHECK (tickets >= 0),
  win_count INTEGER NOT NULL DEFAULT 0 CHECK (win_count >= 0),
  lose_count INTEGER NOT NULL DEFAULT 0 CHECK (lose_count >= 0),
  total_games INTEGER NOT NULL DEFAULT 0 CHECK (total_games >= 0),
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE players
ADD COLUMN IF NOT EXISTS account VARCHAR(255) UNIQUE;

ALTER TABLE players
ALTER COLUMN avatar_id SET DEFAULT 1;

UPDATE players
SET avatar_id = 1
WHERE avatar_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'players'
      AND constraint_name = 'players_auth_user_id_fkey'
  ) THEN
    ALTER TABLE players
    ADD CONSTRAINT players_auth_user_id_fkey
    FOREIGN KEY (auth_user_id)
    REFERENCES auth.users(id);
  END IF;
END $$;

CREATE TABLE player_currency_logs (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  currency VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  type VARCHAR(30) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (currency IN ('coin', 'diamond', 'ticket')),
  CHECK (amount <> 0)
);

CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  currency VARCHAR(20) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  purchase_limit INTEGER CHECK (purchase_limit IS NULL OR purchase_limit > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (type IN ('card_skin', 'card_back', 'gacha_ticket', 'board_skin', 'avatar')),
  CHECK (currency IN ('coin', 'diamond', 'ticket')),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

CREATE TABLE player_items (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  shop_item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, shop_item_id)
);

CREATE TABLE shop_purchase_logs (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  shop_item_id INTEGER NOT NULL REFERENCES shop_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  currency VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (currency IN ('coin', 'diamond', 'ticket'))
);

CREATE TABLE player_equipped_items (
  player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  avatar_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  card_skin_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  card_back_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  board_skin_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_player_id INTEGER NOT NULL REFERENCES players(id),
  receiver_player_id INTEGER NOT NULL REFERENCES players(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  CONSTRAINT friend_requests_no_self
    CHECK (sender_player_id <> receiver_player_id),
  CONSTRAINT friend_requests_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE UNIQUE INDEX unique_pending_friend_request_pair
ON friend_requests(
  LEAST(sender_player_id, receiver_player_id),
  GREATEST(sender_player_id, receiver_player_id)
)
WHERE status = 'pending';

CREATE INDEX friend_requests_sender_player_id_idx
ON friend_requests(sender_player_id);

CREATE INDEX friend_requests_receiver_player_id_idx
ON friend_requests(receiver_player_id);

CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  friend_player_id INTEGER NOT NULL REFERENCES players(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT friends_no_self
    CHECK (player_id <> friend_player_id),
  CONSTRAINT unique_friend_pair
    UNIQUE (player_id, friend_player_id)
);

CREATE INDEX friends_friend_player_id_idx
ON friends(friend_player_id);

CREATE TABLE game_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(6) UNIQUE NOT NULL,
  host_player_id INTEGER REFERENCES players(id),
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_room_players (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  player_id INTEGER REFERENCES players(id),
  role VARCHAR(20),
  seat_order INTEGER,
  is_ready BOOLEAN DEFAULT false,
  is_alive BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_room_player
ON game_room_players(room_id, player_id);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  winner_player_id INTEGER REFERENCES players(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  rank INTEGER NOT NULL,
  type VARCHAR(30),
  quantity INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_cards (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  player_id INTEGER REFERENCES players(id),
  card_id INTEGER REFERENCES cards(id),
  status VARCHAR(20) DEFAULT 'in_hand',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE action_logs (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  player_id INTEGER REFERENCES players(id),
  action_type VARCHAR(50),
  action_detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  match_id INTEGER REFERENCES matches(id),
  status VARCHAR(20) DEFAULT 'playing',
  current_turn_player_id INTEGER REFERENCES players(id),
  state_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
