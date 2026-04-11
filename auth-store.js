import crypto from 'crypto';
import { initDatabase, query, withTransaction } from './db.js';

function normalizeUsername(username = '') {
  return String(username).trim().toLowerCase();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    approvedAt: user.approved_at ? (user.approved_at instanceof Date ? user.approved_at.toISOString() : user.approved_at) : null,
    rejectedAt: user.rejected_at ? (user.rejected_at instanceof Date ? user.rejected_at.toISOString() : user.rejected_at) : null
  };
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, user) {
  if (!user?.password_salt || !user?.password_hash) return false;
  const { hash } = hashPassword(password, user.password_salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'));
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export async function initAuthStore() {
  await initDatabase();
}

export async function ensureBootstrapAdmin() {
  await initDatabase();
  const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'cambiami-subito-123').trim();
  const normalized = normalizeUsername(adminUsername);

  const existingRes = await query(
    `SELECT * FROM users WHERE username_lower = $1 AND role = 'admin' LIMIT 1`,
    [normalized]
  );

  let existing = existingRes.rows[0] || null;

  if (!existing) {
    const { salt, hash } = hashPassword(adminPassword);
    const inserted = await query(
      `
        INSERT INTO users (
          username,
          username_lower,
          password_salt,
          password_hash,
          role,
          status,
          approved_at
        )
        VALUES ($1, $2, $3, $4, 'admin', 'approved', NOW())
        RETURNING *
      `,
      [adminUsername, normalized, salt, hash]
    );
    existing = inserted.rows[0];
  }

  return publicUser(existing);
}

export async function findUserByUsername(username) {
  await initDatabase();
  const normalized = normalizeUsername(username);
  const result = await query(`SELECT * FROM users WHERE username_lower = $1 LIMIT 1`, [normalized]);
  return result.rows[0] || null;
}

export async function findUserById(userId) {
  await initDatabase();
  const result = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
  return result.rows[0] || null;
}

export async function createUser({ username, password }) {
  await initDatabase();
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error('Username non valido');

  const existing = await query(`SELECT id FROM users WHERE username_lower = $1 LIMIT 1`, [normalized]);
  if (existing.rows.length > 0) {
    throw new Error('Questo nome utente è già registrato');
  }

  const { salt, hash } = hashPassword(password);
  const inserted = await query(
    `
      INSERT INTO users (
        username,
        username_lower,
        password_salt,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, 'user', 'pending')
      RETURNING *
    `,
    [String(username).trim(), normalized, salt, hash]
  );

  return publicUser(inserted.rows[0]);
}

export async function listUsers() {
  await initDatabase();
  const result = await query(`SELECT * FROM users ORDER BY created_at DESC`);
  return result.rows.map(publicUser);
}

export async function updateUserStatus(userId, status) {
  await initDatabase();
  let approvedAt = null;
  let rejectedAt = null;

  if (status === 'approved') {
    approvedAt = new Date().toISOString();
  }
  if (status === 'rejected') {
    rejectedAt = new Date().toISOString();
  }

  const result = await query(
    `
      UPDATE users
      SET status = $2,
          approved_at = CASE
            WHEN $2 = 'approved' THEN $3::timestamptz
            WHEN $2 = 'pending' THEN NULL
            ELSE approved_at
          END,
          rejected_at = CASE
            WHEN $2 = 'approved' THEN NULL
            WHEN $2 = 'rejected' THEN $4::timestamptz
            WHEN $2 = 'pending' THEN NULL
            ELSE rejected_at
          END
      WHERE id = $1
      RETURNING *
    `,
    [userId, status, approvedAt, rejectedAt]
  );

  return publicUser(result.rows[0] || null);
}

export async function createSession(userId) {
  await initDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
    await client.query(
      `
        INSERT INTO sessions (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
      `,
      [crypto.randomUUID(), userId, tokenHash, expiresAt]
    );
  });

  return { token, expiresAt };
}

export async function getSessionWithUser(token) {
  await initDatabase();
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await query(
    `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.token_hash,
        s.created_at AS session_created_at,
        s.expires_at,
        u.*
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  const row = result.rows[0] || null;
  if (!row) return null;

  const expiresAt = row.expires_at instanceof Date ? row.expires_at.getTime() : new Date(row.expires_at).getTime();
  if (expiresAt <= Date.now()) {
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
    return null;
  }

  return {
    session: {
      id: row.session_id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      createdAt: row.session_created_at instanceof Date ? row.session_created_at.toISOString() : row.session_created_at,
      expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at
    },
    user: publicUser(row),
    rawUser: row
  };
}

export async function deleteSession(token) {
  await initDatabase();
  if (!token) return;
  const tokenHash = hashToken(token);
  await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
}

export async function clearSessionsForUser(userId) {
  await initDatabase();
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
