import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createStore } from './db.js';
import { auditLog } from './logger.js';
import { approvalsRouter } from './routes/approvals.js';
import { claimsRouter } from './routes/claims.js';
import { reportsRouter } from './routes/reports.js';
import { InputError, todayUtc } from './services/validation.js';

export function createApp({ filename = ':memory:', now = () => new Date() } = {}) {
  const app = express();
  const store = createStore(filename, todayUtc(now()));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const host = req.get('host') ?? '';
    const origin = req.get('origin');
    res.set('X-Content-Type-Options', 'nosniff');
    if (!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(host) || (origin && origin !== `http://${host}`)) {
      return next(new InputError('LOCAL_ONLY', 'Aplikasi latihan hanya menerima akses lokal.', 403));
    }
    next();
  });
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
  const api = express.Router();
  api.use(express.json({ limit: '16kb' }));
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const id = req.get('x-demo-user');
    req.actor = /^[1-6]$/.test(id ?? '') ? store.getUser(Number(id)) : undefined;
    if (!req.actor) return next(new InputError('DEMO_USER_REQUIRED', 'Pilih akun latihan yang tersedia.', 401));
    next();
  });
  api.get('/session', (req, res) => res.json({ user: req.actor, today: todayUtc(now()) }));
  api.use('/claims', claimsRouter(store, now));
  api.use('/approvals', approvalsRouter(store, now));
  api.use('/reports', reportsRouter(store, now));
  app.use(api);
  app.use((_req, _res, next) => next(new InputError('NOT_FOUND', 'Halaman atau endpoint tidak ditemukan.', 404)));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const known = error instanceof InputError;
    const bodyError = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    const status = known || bodyError ? error.status : 500;
    const code = known ? error.code : bodyError ? 'BODY_INVALID' : 'INTERNAL_ERROR';
    auditLog(status >= 500 ? 'error' : 'warn', 'request.failed', { method: req.method, status, code });
    res.status(status).json({ code, message: known ? error.message : bodyError ? 'Isi JSON tidak valid atau terlalu besar.' : 'Terjadi kesalahan. Coba lagi.' });
  });
  return { app, store };
}

export function startServer({ port = Number(process.env.PORT ?? 3000), filename = process.env.DB_FILE ?? 'data/expense.sqlite' } = {}) {
  const { app, store } = createApp({ filename });
  const server = app.listen(port, '127.0.0.1');
  server.once('close', () => store.close());
  server.once('error', () => store.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = startServer();
  server.on('listening', () => auditLog('info', 'server.started', { port: server.address().port }));
  server.on('error', (err) => {
    auditLog('error', 'server.failed', { code: err.code });
    process.exitCode = 1;
  });
}
