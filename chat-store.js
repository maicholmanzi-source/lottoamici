import crypto from "crypto";
import { initDatabase, query } from "./db.js";

const CHAT_TTL_HOURS = 24;
const CHAT_LIMIT = 80;

function mapRow(row, currentUserId = null) {
  return {
    id: row.id,
    userId: String(row.user_id),
    username: row.username,
    message: row.message_text,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    mine: currentUserId != null && String(row.user_id) === String(currentUserId)
  };
}

export async function initChatStore() {
  await initDatabase();
}

export async function deleteExpiredChatMessages() {
  await initDatabase();
  await query(
    `DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '24 hours'`
  );
}

export async function listRecentChatMessages(currentUserId = null) {
  await deleteExpiredChatMessages();
  const result = await query(
    `
      SELECT c.id, c.user_id, c.message_text, c.created_at, u.username
      FROM chat_messages c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT $1
    `,
    [CHAT_LIMIT]
  );
  return result.rows.reverse().map((row) => mapRow(row, currentUserId));
}

export async function createChatMessage(userId, messageText) {
  await deleteExpiredChatMessages();
  const cleanMessage = String(messageText || "").trim().replace(/\s+/g, " " );
  if (!cleanMessage) {
    throw new Error("Scrivi un messaggio prima di inviare.");
  }
  if (cleanMessage.length > 280) {
    throw new Error("Il messaggio può avere massimo 280 caratteri.");
  }
  const result = await query(
    `
      INSERT INTO chat_messages (id, user_id, message_text, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, message_text, created_at
    `,
    [crypto.randomUUID(), userId, cleanMessage]
  );
  const inserted = result.rows[0];
  const userResult = await query(`SELECT username FROM users WHERE id = $1 LIMIT 1`, [userId]);
  return mapRow({ ...inserted, username: userResult.rows[0]?.username || "Utente" }, userId);
}

export { CHAT_TTL_HOURS, CHAT_LIMIT };
