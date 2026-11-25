export class InputError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const categories = ['Travel', 'Meals', 'Equipment', 'Other'];

export function todayUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function dateOffset(day, days) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return todayUtc(date);
}

export function claimId(input) {
  const id = Number(input);
  if (!/^[1-9]\d*$/.test(input ?? '') || !Number.isSafeInteger(id)) {
    throw new InputError('CLAIM_ID_INVALID', 'ID klaim tidak valid.');
  }
  return id;
}

export function validateClaim(input, today) {
  if (!input || Array.isArray(input) || typeof input !== 'object') {
    throw new InputError('BODY_INVALID', 'Isi klaim harus berupa objek JSON.');
  }
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 100) {
    throw new InputError('TITLE_INVALID', 'Isi judul klaim (maksimal 100 karakter).');
  }
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount > 50_000_000) {
    throw new InputError('AMOUNT_INVALID', 'Jumlah harus berupa rupiah bulat antara 1 dan 50.000.000.');
  }
  const notes = input.notes ?? '';
  const attachment = input.attachment ?? '';
  if (typeof notes !== 'string' || notes.length > 500) {
    throw new InputError('NOTES_INVALID', 'Catatan maksimal 500 karakter.');
  }
  if (typeof attachment !== 'string' || attachment.length > 120 || /[/\\]/.test(attachment) || attachment === '.' || attachment === '..') {
    throw new InputError('ATTACHMENT_INVALID', 'Isi nama file saja, bukan alamat file.');
  }
  return { title, category: 'Other', amount: input.amount, claimDate: today, notes: notes.trim(), attachment: attachment.trim() };
}

export function reportMonth(value, today) {
  const month = value ?? today.slice(0, 7);
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new InputError('MONTH_INVALID', 'Gunakan format bulan YYYY-MM.');
  }
  return month;
}
