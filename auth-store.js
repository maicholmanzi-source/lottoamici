import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'auth-data.json');

const DEFAULT_DATA = {
  nextUserId: 1,
  users: [],
  sessions: []
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

async function loadData() {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      nextUserId: Number(parsed.nextUserId) || 1,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

async function saveData(data) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

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
    createdAt: user.createdAt,
    approvedAt: user.approvedAt || null,
    rejectedAt: user.rejectedAt || null
  };
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, user) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export async function initAuthStore() {
  await ensureDataFile();
}

export async function ensureBootstrapAdmin() {
  const data = await loadData();
  const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'cambiami-subito-123').trim();
  const normalized = normalizeUsername(adminUsername);
  let existing = data.users.find((user) => normalizeUsername(user.username) === normalized && user.role === 'admin');

  if (!existing) {
    const { salt, hash } = hashPassword(adminPassword);
    existing = {
      id: data.nextUserId++,
      username: adminUsername,
      usernameLower: normalized,
      passwordSalt: salt,
      passwordHash: hash,
      role: 'admin',
      status: 'approved',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };
    data.users.push(existing);
    await saveData(data);
  }

  return publicUser(existing);
}

export async function findUserByUsername(username) {
  const data = await loadData();
  const normalized = normalizeUsername(username);
  const user = data.users.find((entry) => normalizeUsername(entry.username) === normalized);
  return user || null;
}

export async function findUserById(userId) {
  const data = await loadData();
  const user = data.users.find((entry) => String(entry.id) === String(userId));
  return user || null;
}

export async function createUser({ username, password }) {
  const data = await loadData();
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error('Username non valido');
  if (data.users.some((entry) => normalizeUsername(entry.username) === normalized)) {
    throw new Error('Questo nome utente è già registrato');
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: data.nextUserId++,
    username: String(username).trim(),
    usernameLower: normalized,
    passwordSalt: salt,
    passwordHash: hash,
    role: 'user',
    status: 'pending',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    rejectedAt: null
  };

  data.users.push(user);
  await saveData(data);
  return publicUser(user);
}

export async function listUsers() {
  const data = await loadData();
  return [...data.users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(publicUser);
}

export async function updateUserStatus(userId, status) {
  const data = await loadData();
  const user = data.users.find((entry) => String(entry.id) === String(userId));
  if (!user) return null;
  user.status = status;
  if (status === 'approved') {
    user.approvedAt = new Date().toISOString();
    user.rejectedAt = null;
  }
  if (status === 'rejected') {
    user.rejectedAt = new Date().toISOString();
  }
  await saveData(data);
  return publicUser(user);
}

export async function createSession(userId) {
  const data = await loadData();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  data.sessions = data.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
  data.sessions.push({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    createdAt: new Date().toISOString(),
    expiresAt
  });

  await saveData(data);
  return { token, expiresAt };
}

export async function getSessionWithUser(token) {
  if (!token) return null;
  const data = await loadData();
  const tokenHash = hashToken(token);
  const session = data.sessions.find((entry) => entry.tokenHash === tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    data.sessions = data.sessions.filter((entry) => entry.id !== session.id);
    await saveData(data);
    return null;
  }

  const user = data.users.find((entry) => String(entry.id) === String(session.userId));
  if (!user) return null;
  return {
    session,
    user: publicUser(user),
    rawUser: user
  };
}

export async function deleteSession(token) {
  if (!token) return;
  const data = await loadData();
  const tokenHash = hashToken(token);
  data.sessions = data.sessions.filter((entry) => entry.tokenHash !== tokenHash);
  await saveData(data);
}

export async function clearSessionsForUser(userId) {
  const data = await loadData();
  data.sessions = data.sessions.filter((entry) => String(entry.userId) !== String(userId));
  await saveData(data);
}
