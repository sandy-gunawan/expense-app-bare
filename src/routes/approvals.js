import { Router } from 'express';
import { auditLog } from '../logger.js';
import { nextApprovalStatus } from '../services/approvalRules.js';
import { claimId, InputError } from '../services/validation.js';

export function approvalsRouter(store, now) {
  const router = Router();
  router.use((req, _res, next) => {
    if (req.actor.role === 'employee') throw new InputError('APPROVER_REQUIRED', 'Pilih peran manager atau Finance.', 403);
    next();
  });
  router.get('/', (req, res) => {
    const status = req.actor.role === 'manager' ? 'pending' : 'pending_finance';
    res.json({ claims: store.listClaims(req.actor).filter((claim) => claim.status === status) });
  });
  router.post('/:id', (req, res) => {
    const id = claimId(req.params.id);
    const claim = store.approve(id, req.actor, req.body?.decision, now().toISOString(), (current, actor, decision) => {
      if (!current) throw new InputError('CLAIM_NOT_FOUND', 'Klaim tidak ditemukan.', 404);
      return nextApprovalStatus(current, actor, decision);
    });
    auditLog('info', 'claims.approval', { claimId: id, status: claim.status });
    res.json({ claim });
  });
  return router;
}
