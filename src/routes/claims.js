import { Router } from 'express';
import { auditLog } from '../logger.js';
import { claimId, InputError, todayUtc, validateClaim } from '../services/validation.js';

export function claimsRouter(store, now) {
  const router = Router();
  router.get('/', (req, res) => {
    const claims = store.listClaims(req.actor);
    auditLog('info', 'claims.list', { count: claims.length });
    res.json({ claims });
  });
  router.get('/:id', (req, res) => {
    const claim = store.getClaim(claimId(req.params.id));
    if (!claim || (req.actor.role === 'employee' && claim.employeeId !== req.actor.id)
      || (req.actor.role === 'manager' && claim.department !== req.actor.department)) {
      throw new InputError('CLAIM_NOT_FOUND', 'Klaim tidak ditemukan.', 404);
    }
    res.json({ claim });
  });
  router.post('/', (req, res) => {
    if (req.actor.role !== 'employee') throw new InputError('EMPLOYEE_REQUIRED', 'Hanya karyawan yang dapat mengajukan klaim.', 403);
    const claim = store.createClaim(validateClaim(req.body, todayUtc(now())), req.actor.id);
    auditLog('info', 'claims.create', { claimId: claim.id });
    res.status(201).json({ claim });
  });
  return router;
}
