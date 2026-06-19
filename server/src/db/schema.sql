CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  avatar_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  is_alive BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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