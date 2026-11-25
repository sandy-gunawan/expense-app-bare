import { Router } from 'express';
import { InputError, todayUtc } from '../services/validation.js';

export function reportsRouter(store, now) {
  const router = Router();
  router.get('/', (req, res) => {
    if (req.actor.role !== 'finance') throw new InputError('FINANCE_REQUIRED', 'Hanya Finance yang dapat membuka laporan.', 403);
    const month = typeof req.query.month === 'string' ? req.query.month : todayUtc(now()).slice(0, 7);
    const rows = store.report(month);
    res.json({ month, rows });
  });
  return router;
}
