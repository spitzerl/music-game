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
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

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
      UNIQUE (session_id, voter_id, music_id)
    )
  `);

  await pool.query(`
    ALTER TABLE sessions 
    ADD COLUMN IF NOT EXISTS max_musics_per_player INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS selection_duration INTEGER DEFAULT 120,
    ADD COLUMN IF NOT EXISTS extract_duration INTEGER DEFAULT 20,
    ADD COLUMN IF NOT EXISTS voting_duration INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS show_answers BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 12,
    ADD COLUMN IF NOT EXISTS current_music_index INTEGER DEFAULT -1,
    ADD COLUMN IF NOT EXISTS voting_status VARCHAR(20) DEFAULT 'idle',
    ADD COLUMN IF NOT EXISTS timer_ends_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS show_vote_count BOOLEAN DEFAULT TRUE;
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_observer BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE musics
    ADD COLUMN IF NOT EXISTS play_order INTEGER DEFAULT -1;
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
    gameService.setIoNamespace(gameNamespace);
    registerGameSocket(gameNamespace, gameService);

    const app = createApp(gameService, gameNamespace);
    const server = createServer(app);
    io.attach(server);

    await gameService.recoverSessions();

    server.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start backend:', error);
    process.exit(1);
  }
}

bootstrap();
