import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'user-tickets.json');

const DEFAULT_DATA = {
  tickets: []
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
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : []
    };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

async function saveData(data) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function initTicketsStore() {
  await ensureDataFile();
}

export async function listTicketsByUser(userId) {
  const data = await loadData();
  return data.tickets
    .filter((ticket) => String(ticket.userId) === String(userId))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function createTicket(userId, payload) {
  const data = await loadData();
  const ticket = {
    id: crypto.randomUUID(),
    userId: String(userId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload
  };
  data.tickets.push(ticket);
  await saveData(data);
  return ticket;
}

export async function deleteTicket(userId, ticketId) {
  const data = await loadData();
  const before = data.tickets.length;
  data.tickets = data.tickets.filter((ticket) => !(String(ticket.userId) === String(userId) && String(ticket.id) === String(ticketId)));
  const deleted = data.tickets.length !== before;
  if (deleted) {
    await saveData(data);
  }
  return deleted;
}
