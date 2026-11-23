import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScriptRouter } from './routes/script.js';
import { createCharacterRouter } from './routes/character.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/script', createScriptRouter());
  app.use('/api/character', createCharacterRouter());

  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  return app;
}
