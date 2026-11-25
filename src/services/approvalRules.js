import { InputError } from './validation.js';

export function nextApprovalStatus(claim, actor, decision) {
  if (!['approve', 'reject'].includes(decision)) {
    throw new InputError('APPROVAL_INVALID', 'Pilih approve atau reject.');
  }
  if (claim.employeeId === actor.id) {
    throw new InputError('SELF_APPROVAL', 'Pengaju tidak boleh memeriksa klaim sendiri.', 403);
  }
  if (['approved', 'rejected'].includes(claim.status)) {
    throw new InputError('CLAIM_FINAL', 'Klaim sudah selesai diperiksa.', 409);
  }
  if (claim.status === 'pending' && (actor.role !== 'manager' || actor.department !== claim.department)) {
    throw new InputError('MANAGER_REQUIRED', 'Klaim harus diperiksa oleh manager tim.', 403);
  }
  if (claim.status === 'pending_finance' && actor.role !== 'finance') {
    throw new InputError('FINANCE_REQUIRED', 'Klaim menunggu persetujuan Finance.', 403);
  }
  if (decision === 'reject') return 'rejected';
  return claim.status === 'pending' && claim.amount > 1_000_000 ? 'pending_finance' : 'approved';
}
