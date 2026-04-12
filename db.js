import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL non configurato. Aggiungi un database PostgreSQL e imposta DATABASE_URL nelle variabili ambiente.');
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

let initPromise = null;

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withTransaction(fn) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function initDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          username_lower TEXT NOT NULL UNIQUE,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          approved_at TIMESTAMPTZ NULL,
          rejected_at TIMESTAMPTZ NULL
        )
      `);

      await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
        ON users (username_lower)
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS sessions_user_id_idx
        ON sessions (user_id)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS sessions_expires_at_idx
        ON sessions (expires_at)
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS user_tickets (
          id UUID PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS user_tickets_user_id_idx
        ON user_tickets (user_id, created_at DESC)
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message_text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx
        ON chat_messages (created_at DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
        ON chat_messages (user_id, created_at DESC)
      `);
    })();
  }

  return initPromise;
}
