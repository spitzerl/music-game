# music-game

Jeu musical multijoueur (Vue 3 + Node.js + Socket.IO + PostgreSQL + Redis).

## Structure

- `frontend`: client Vue 3 + Vite + Pinia + Socket.IO client
- `backend`: API Express + Socket.IO + PostgreSQL + Redis
- `compose.yaml`: stack complète (frontend, backend, postgres, redis, nginx)

## Développement local

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API disponible sur `http://localhost:3001`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Production Docker

```bash
docker compose up --build
```

- Reverse proxy Nginx exposé sur `http://localhost`
- API derrière `/api`
- WebSocket Socket.IO derrière `/socket.io`

## Variables d'environnement

### Backend (`backend/.env`)

- `PORT=3001`
- `DATABASE_URL=postgresql://...`
- `REDIS_URL=redis://...`
- `NODE_ENV=development|production`
- `CORS_ORIGIN=http://localhost:3000`

### Frontend (`frontend/.env`)

- `VITE_API_URL=http://localhost:3001/api` (dev local)
- `VITE_SOCKET_URL=http://localhost:3001` (dev local)

En Docker, les variables sont injectées via `compose.yaml`.
