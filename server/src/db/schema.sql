CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  avatar_id INTEGER,
  bio TEXT DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  exp INTEGER NOT NULL DEFAULT 0 CHECK (exp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0 AND coins <= 99999),
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0 AND gems <= 99999),
  tickets INTEGER NOT NULL DEFAULT 0 CHECK (tickets >= 0 AND tickets <= 99999),
  win_count INTEGER NOT NULL DEFAULT 0 CHECK (win_count >= 0),
  lose_count INTEGER NOT NULL DEFAULT 0 CHECK (lose_count >= 0),
  total_games INTEGER NOT NULL DEFAULT 0 CHECK (total_games >= 0),
  title VARCHAR(100),
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE players
ADD COLUMN IF NOT EXISTS account VARCHAR(255) UNIQUE;

ALTER TABLE players
ADD COLUMN IF NOT EXISTS title VARCHAR(100);

ALTER TABLE players
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

UPDATE players
SET bio = ''
WHERE bio IS NULL;

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

CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (player_id <> friend_id),
  CHECK (status IN ('pending', 'accepted', 'blocked'))
);

CREATE UNIQUE INDEX unique_friend_pair
ON friends(
  LEAST(player_id, friend_id),
  GREATEST(player_id, friend_id)
);

CREATE INDEX friends_player_status_idx
ON friends(player_id, status);

CREATE INDEX friends_friend_status_idx
ON friends(friend_id, status);

CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  reward_currency VARCHAR(20),
  reward_amount INTEGER NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (reward_currency IS NULL OR reward_currency IN ('coin', 'diamond', 'ticket'))
);

CREATE TABLE player_achievements (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_match_id INTEGER,
  UNIQUE (player_id, achievement_id)
);

CREATE INDEX player_achievements_player_id_idx
ON player_achievements(player_id);

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

CREATE TABLE top_up_orders (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  package_id VARCHAR(50) NOT NULL,
  currency VARCHAR(20) NOT NULL DEFAULT 'diamond',
  amount INTEGER NOT NULL CHECK (amount > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (currency IN ('diamond')),
  CHECK (status IN ('pending', 'paid'))
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
  card_skin_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  card_back_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  board_skin_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  is_computer BOOLEAN NOT NULL DEFAULT false,
  is_alive BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_room_player
ON game_room_players(room_id, player_id);

CREATE TABLE room_invitations (
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

CREATE UNIQUE INDEX unique_pending_room_invitation
ON room_invitations(room_id, invitee_player_id)
WHERE status = 'pending';

CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  sender_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(BTRIM(content)) > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (sender_player_id <> receiver_player_id)
);

CREATE INDEX direct_messages_conversation_idx
ON direct_messages(
  LEAST(sender_player_id, receiver_player_id),
  GREATEST(sender_player_id, receiver_player_id),
  created_at,
  id
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES game_rooms(id),
  winner_player_id INTEGER REFERENCES players(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

ALTER TABLE player_achievements
ADD CONSTRAINT player_achievements_source_match_id_fkey
FOREIGN KEY (source_match_id)
REFERENCES matches(id)
ON DELETE SET NULL;

CREATE INDEX player_achievements_source_match_idx
ON player_achievements(source_match_id, player_id);

CREATE TABLE match_participants (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  username_snapshot VARCHAR(50) NOT NULL,
  avatar_id_snapshot INTEGER,
  round_wins INTEGER NOT NULL DEFAULT 0 CHECK (round_wins >= 0),
  result VARCHAR(10) NOT NULL,
  exp_gained INTEGER NOT NULL DEFAULT 0 CHECK (exp_gained >= 0),
  coins_gained INTEGER NOT NULL DEFAULT 0 CHECK (coins_gained >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (result IN ('win', 'lose')),
  UNIQUE (match_id, player_id)
);

CREATE INDEX match_participants_player_idx
ON match_participants(player_id, match_id);

CREATE INDEX match_participants_match_idx
ON match_participants(match_id);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  rank INTEGER NOT NULL,
  type VARCHAR(30),
  quantity INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gacha_pools (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gacha_cards (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  rank INTEGER NOT NULL,
  type VARCHAR(30),
  description TEXT,
  image_key VARCHAR(100),
  frame_key VARCHAR(100),
  image_url TEXT,
  frame_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gacha_pool_cards (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE,
  gacha_card_id INTEGER NOT NULL REFERENCES gacha_cards(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL CHECK (weight > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (pool_id, gacha_card_id)
);

CREATE TABLE player_gacha_cards (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  gacha_card_id INTEGER NOT NULL REFERENCES gacha_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, gacha_card_id)
);

CREATE TABLE gacha_draw_logs (
  id SERIAL PRIMARY KEY,
  batch_id UUID NOT NULL,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pool_id INTEGER NOT NULL REFERENCES gacha_pools(id),
  gacha_card_id INTEGER NOT NULL REFERENCES gacha_cards(id),
  ticket_cost INTEGER NOT NULL CHECK (ticket_cost > 0),
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  compensation_coins INTEGER NOT NULL DEFAULT 0 CHECK (compensation_coins >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gacha_pools (code, name)
VALUES
  ('role_cards', '角色卡池'),
  ('tarot_cards', '塔羅牌占星卡池')
ON CONFLICT (code) DO NOTHING;

INSERT INTO gacha_cards (code, name, rank, type, description, image_key, frame_key, image_url, frame_url)
VALUES
  ('card_001', '樂高實習生', 1, 'role', '樂高實習生', 'intern', 'intern', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-intern-card-skin_yeap7f.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-intern-card-frame_ejahmh.webp'),
  ('card_002', '樂高打掃阿姨', 2, 'role', '樂高打掃阿姨', 'cleaner', 'cleaner', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-skin_ko1tbt.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-frame_k2l66z.webp'),
  ('card_003', '樂高部門主管', 3, 'role', '樂高部門主管', 'manager', 'manager', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016295/lego-manager-card-skin_wkq4hg.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-manager-card-frame_nhuarb.webp'),
  ('card_004', '樂高職場老鳥', 4, 'role', '樂高職場老鳥', 'senior', 'senior', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016298/lego-senior-card-skin_auanea.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-senior-card-frame_axweus.webp'),
  ('card_005', '樂高專案經理', 5, 'role', '樂高專案經理', 'pm', 'pm', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016297/lego-pm-card-skin_is3lyw.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-pm-card-frame_hlsid9.webp'),
  ('card_006', '樂高人資主管', 6, 'role', '樂高人資主管', 'hr', 'hr', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-hr-card-skin_wir4jw.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016292/lego-hr-card-frame_qofkeq.webp'),
  ('card_007', '樂高資深顧問', 7, 'role', '樂高資深顧問', 'advisor', 'advisor', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-skin_r7dqww.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-frame_y52pim.webp'),
  ('card_008', '樂高執行長', 8, 'role', '樂高執行長', 'ceo', 'ceo', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016290/lego-ceo-card-skin_msw96k.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784016289/lego-ceo-card-frame_nmieox.webp'),
  ('card_101', '實習生', 1, 'role', '實習生', 'intern', 'intern', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-intern_hypihm.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519789/card-frame-intern_f65un0.webp'),
  ('card_102', '打掃阿姨', 2, 'role', '打掃阿姨', 'cleaner', 'cleaner', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-cleaner_vgx7ny.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519787/card-frame-cleaner_xdo53r.webp'),
  ('card_103', '部門主管', 3, 'role', '部門主管', 'manager', 'manager', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-manager_atavfx.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519790/card-frame-manager_g3tn5r.webp'),
  ('card_104', '職場老鳥', 4, 'role', '職場老鳥', 'senior', 'senior', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519785/card-bg-senior_c30b07.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-senior_i77pph.webp'),
  ('card_105', '專案經理', 5, 'role', '專案經理', 'pm', 'pm', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-pm_sn89qt.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-pm_vquajq.webp'),
  ('card_106', '人資主管', 6, 'role', '人資主管', 'hr', 'hr', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-hr_bmgetc.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519788/card-frame-hr_dguvjr.webp'),
  ('card_107', '資深顧問', 7, 'role', '資深顧問', 'advisor', 'advisor', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-advisor_lv9hg4.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-advisor_ioylpq.webp'),
  ('card_108', '執行長', 8, 'role', '執行長', 'ceo', 'ceo', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-ceo_tazytm.webp', 'https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-ceo_owxrqb.webp')
ON CONFLICT (code) DO NOTHING;

INSERT INTO gacha_pool_cards (pool_id, gacha_card_id, weight)
SELECT gp.id, gc.id, weights.weight
FROM gacha_pools gp
JOIN (
  VALUES
    ('role_cards', 'card_001', 400),
    ('role_cards', 'card_002', 250),
    ('role_cards', 'card_003', 150),
    ('role_cards', 'card_004', 100),
    ('role_cards', 'card_005', 50),
    ('role_cards', 'card_006', 30),
    ('role_cards', 'card_007', 15),
    ('role_cards', 'card_008', 5),
    ('tarot_cards', 'card_101', 400),
    ('tarot_cards', 'card_102', 250),
    ('tarot_cards', 'card_103', 150),
    ('tarot_cards', 'card_104', 100),
    ('tarot_cards', 'card_105', 50),
    ('tarot_cards', 'card_106', 30),
    ('tarot_cards', 'card_107', 15),
    ('tarot_cards', 'card_108', 5)
) AS weights(pool_code, card_code, weight) ON weights.pool_code = gp.code
JOIN gacha_cards gc ON gc.code = weights.card_code
ON CONFLICT (pool_id, gacha_card_id) DO NOTHING;

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

