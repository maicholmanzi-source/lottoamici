import crypto from 'crypto';
import { initDatabase, query } from './db.js';

function mapRowToTicket(row) {
  const payload = row.payload || {};
  return {
    id: row.id,
    userId: String(row.user_id),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    ...payload
  };
}

export async function initTicketsStore() {
  await initDatabase();
}

export async function listTicketsByUser(userId) {
  await initDatabase();
  const result = await query(
    `
      SELECT id, user_id, payload, created_at, updated_at
      FROM user_tickets
      WHERE user_id::text = $1::text
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapRowToTicket);
}

export async function countTicketsByUser(userId) {
  await initDatabase();
  const result = await query(
    `SELECT COUNT(*)::int AS total FROM user_tickets WHERE user_id::text = $1::text`,
    [userId]
  );
  return Number(result.rows[0]?.total || 0);
}

export async function createTicket(userId, payload) {
  await initDatabase();
  const id = crypto.randomUUID();
  const result = await query(
    `
      INSERT INTO user_tickets (id, user_id, payload, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW(), NOW())
      RETURNING id, user_id, payload, created_at, updated_at
    `,
    [id, userId, JSON.stringify(payload)]
  );
  return mapRowToTicket(result.rows[0]);
}

export async function deleteTicket(userId, ticketId) {
  await initDatabase();
  const result = await query(
    `DELETE FROM user_tickets WHERE user_id::text = $1::text AND id = $2`,
    [userId, ticketId]
  );
  return result.rowCount > 0;
}
