import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import buildRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createApp(gameService, ioNamespace) {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());

  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', buildRoutes(gameService, ioNamespace));

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Erreur interne du serveur',
    });
  });

  return app;
}
