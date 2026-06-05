import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './config/database.js';
import redisClient from './config/redis.js';
import createApp from './app.js';
import GameService from './services/GameService.js';
import registerGameSocket from './sockets/gameSocket.js';

dotenv.config();

const PORT = Number.parseInt(process.env.PORT || '3001', 10);

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(6) UNIQUE NOT NULL,
      host_name VARCHAR(100) NOT NULL,
      phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
      max_musics_per_player INTEGER NOT NULL DEFAULT 3,
      selection_duration INTEGER NOT NULL DEFAULT 120,
      extract_duration INTEGER NOT NULL DEFAULT 20,
      voting_duration INTEGER NOT NULL DEFAULT 30,
      show_answers BOOLEAN NOT NULL DEFAULT TRUE,
      max_players INTEGER NULL,
      selection_ends_at TIMESTAMP NULL,
      voting_started_at TIMESTAMP NULL,
      current_music_index INTEGER NOT NULL DEFAULT 0,
      voting_stage VARCHAR(20) NULL,
      stage_ends_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_musics_per_player INTEGER NOT NULL DEFAULT 3`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS selection_duration INTEGER NOT NULL DEFAULT 120`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS extract_duration INTEGER NOT NULL DEFAULT 20`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voting_duration INTEGER NOT NULL DEFAULT 30`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS show_answers BOOLEAN NOT NULL DEFAULT TRUE`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_players INTEGER NULL`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS selection_ends_at TIMESTAMP NULL`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voting_started_at TIMESTAMP NULL`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS current_music_index INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voting_stage VARCHAR(20) NULL`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stage_ends_at TIMESTAMP NULL`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      client_id VARCHAR(120) NOT NULL,
      is_host BOOLEAN NOT NULL DEFAULT FALSE,
      is_bot BOOLEAN NOT NULL DEFAULT FALSE,
      connected BOOLEAN NOT NULL DEFAULT TRUE,
      can_vote BOOLEAN NOT NULL DEFAULT TRUE,
      disconnected_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(session_id, client_id)
    )
  `);

  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS client_id VARCHAR(120)`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_host BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS connected BOOLEAN NOT NULL DEFAULT TRUE`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS can_vote BOOLEAN NOT NULL DEFAULT TRUE`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMP NULL`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS musics (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      voter_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      music_id INTEGER NOT NULL REFERENCES musics(id) ON DELETE CASCADE,
      guessed_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (session_id, voter_id, music_id)
    )
  `);

  await pool.query(`ALTER TABLE votes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_music_queue (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      music_id INTEGER NOT NULL REFERENCES musics(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      UNIQUE(session_id, position),
      UNIQUE(session_id, music_id)
    )
  `);
}

async function bootstrap() {
  try {
    await initSchema();

    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('Redis indisponible, continuation sans cache:', error.message);
    }

    const io = new Server({
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });

    const gameNamespace = io.of('/game');
    const gameService = new GameService();

    gameService.setNotifier(async (code) => {
      gameNamespace.to(code).emit('state:refresh', { code });
    });

    registerGameSocket(gameNamespace, gameService);

    const app = createApp(gameService);
    const server = createServer(app);
    io.attach(server);

    server.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start backend:', error);
    process.exit(1);
  }
}

bootstrap();
