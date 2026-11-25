import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server.js';

const now = () => new Date('2026-01-15T00:15:00Z');
const input = { title: 'Taksi bandara', amount: 250_000, claimDate: '2026-01-15' };

describe('Expense Claim API', () => {
  let app;
  let store;
  let api;

  beforeEach(() => {
    ({ app, store } = createApp({ now }));
    api = request(app);
  });
  afterEach(() => store.close());

  const asUser = (req, id = 1) => req.set('x-demo-user', String(id));
  const submit = (body) => asUser(api.post('/claims')).send({ ...input, ...body });

  it('loads twenty fixture claims and six demo actors', async () => {
    const { body } = await asUser(api.get('/claims'), 5).expect(200);
    expect(body.claims).toHaveLength(20);
    expect((await asUser(api.get('/session'), 6).expect(200)).body.user.role).toBe('finance');
  });

  it('returns a UTC day independent of host timezone', async () => {
    expect((await asUser(api.get('/session')).expect(200)).body.today).toBe('2026-01-15');
  });

  it('requires a valid demo actor', async () => {
    const { body } = await asUser(api.get('/claims'), 99).expect(401);
    expect(body.code).toBe('DEMO_USER_REQUIRED');
  });

  it('rejects concurrent access from a foreign origin', async () => {
    const { body } = await asUser(api.get('/claims')).set('Origin', 'https://example.invalid').expect(403);
    expect(body.code).toBe('LOCAL_ONLY');
  });

  it('limits each employee to their own claims', async () => {
    const { body } = await asUser(api.get('/claims')).expect(200);
    expect(body.claims).toHaveLength(10);
    expect(body.claims.every((claim) => claim.employeeId === 1)).toBe(true);
    await asUser(api.get('/claims/2')).expect(404);
  });

  it('records the UTC day when a claim is filed', async () => {
    const { body } = await submit({ title: '  Taksi bandara  ' }).expect(201);
    expect(body.claim).toMatchObject({ ...input, status: 'pending', employeeId: 1 });
  });

  it.each([
    [{ amount: 0 }, 'AMOUNT_INVALID'],
    [{ amount: 50_000_001 }, 'AMOUNT_INVALID'],
    [{ attachment: 'folder/receipt.pdf' }, 'ATTACHMENT_INVALID'],
    [{ title: '  ' }, 'TITLE_INVALID'],
  ])('validates %o', async (changes, code) => {
    expect((await submit(changes).expect(400)).body.code).toBe(code);
  });

  it('does not let Finance submit a claim', async () => {
    await asUser(api.post('/claims'), 5).send(input).expect(403);
  });

  it('does not let another team manager approve a claim', async () => {
    await asUser(api.post('/approvals/1'), 4).send({ decision: 'approve' }).expect(403);
  });

  it('supports approval and rejects a repeat decision', async () => {
    const approve = () => asUser(api.post('/approvals/1'), 3).send({ decision: 'approve' });
    expect((await approve().expect(200)).body.claim.status).toBe('approved');
    await approve().expect(409);
  });

  it('restricts monthly reports to Finance', async () => {
    await asUser(api.get('/reports'), 1).expect(403);
    expect((await asUser(api.get('/reports?month=2026-01'), 5).expect(200)).body.rows.length).toBeGreaterThan(0);
  });
});
