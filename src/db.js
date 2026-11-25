import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { categories, dateOffset } from './services/validation.js';

const fixtureUsers = [
  [1, 'Karyawan A', 'employee', 'Operasional'],
  [2, 'Karyawan B', 'employee', 'Teknologi'],
  [3, 'Manager A', 'manager', 'Operasional'],
  [4, 'Manager B', 'manager', 'Teknologi'],
  [5, 'Finance A', 'finance', 'Keuangan'],
  [6, 'Finance B', 'finance', 'Keuangan'],
];

export function createStore(filename, today) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, department TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY, employeeId INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL, category TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0),
      claimDate TEXT NOT NULL, attachment TEXT NOT NULL, notes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS claim_events (
      id INTEGER PRIMARY KEY, claimId INTEGER NOT NULL REFERENCES claims(id),
      actorId INTEGER NOT NULL REFERENCES users(id), at TEXT NOT NULL,
      fromStatus TEXT NOT NULL, toStatus TEXT NOT NULL
    );
  `);
  const addClaim = db.prepare(`
    INSERT INTO claims (employeeId, title, category, amount, claimDate, attachment, notes, status)
    VALUES (@employeeId, @title, @category, @amount, @claimDate, @attachment, @notes, @status)
  `);
  const addEvent = db.prepare('INSERT INTO claim_events (claimId, actorId, at, fromStatus, toStatus) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    if (db.prepare('SELECT 1 FROM users LIMIT 1').get()) return;
    const addUser = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)');
    for (const user of fixtureUsers) addUser.run(...user);
    for (let index = 0; index < 20; index++) {
      const employeeId = index % 2 + 1;
      const status = index >= 4 ? 'approved' : 'pending';
      const result = addClaim.run({
        employeeId, title: `Klaim latihan ${index + 1}`, category: categories[index % categories.length],
        amount: index < 2 ? 750_000 : (index + 3) * 55_000,
        claimDate: index < 6 ? today : dateOffset(today, -index),
        attachment: '', notes: '', status,
      });
      if (status === 'approved') addEvent.run(Number(result.lastInsertRowid), employeeId + 2, `${today}T00:00:00Z`, 'pending', status);
    }
  })();
  const claimQuery = 'SELECT claims.*, users.department FROM claims JOIN users ON users.id = claims.employeeId';
  const readClaim = db.prepare(`${claimQuery} WHERE claims.id = ?`);
  const visibleClaims = db.prepare(`
    SELECT claims.* FROM claims JOIN users ON users.id = claims.employeeId
    WHERE (@role = 'finance') OR (@role = 'employee' AND employeeId = @id)
      OR (@role = 'manager' AND users.department = @department)
    ORDER BY claims.id DESC LIMIT 100
  `);
  const departmentFor = db.prepare('SELECT department FROM users WHERE id = ?');
  const applyApproval = db.transaction((id, actor, decision, at, nextStatus) => {
    const claim = readClaim.get(id);
    const status = nextStatus(claim, actor, decision);
    db.prepare('UPDATE claims SET status = ? WHERE id = ?').run(status, id);
    addEvent.run(id, actor.id, at, claim.status, status);
    return readClaim.get(id);
  });
  return {
    close: () => db.close(),
    getUser: (id) => db.prepare('SELECT id, name, role, department FROM users WHERE id = ?').get(id),
    getClaim: (id) => readClaim.get(id),
    listClaims: (actor) => visibleClaims.all(actor).map((claim) => ({
      ...claim, department: departmentFor.get(claim.employeeId).department,
    })),
    createClaim: (input, employeeId) => readClaim.get(addClaim.run({ ...input, employeeId, status: 'pending' }).lastInsertRowid),
    approve: applyApproval,
    report: (month) => db.prepare(`
      SELECT category, users.department, count(*) AS claimCount, sum(amount) AS total
      FROM claims JOIN users ON users.id = claims.employeeId
      WHERE status = 'approved' AND substr(claimDate, 1, 7) = ?
      GROUP BY category, users.department ORDER BY category, users.department
    `).all(month),
  };
}
