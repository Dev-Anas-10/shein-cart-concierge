/**
 * Persistent database layer.
 *
 * Strategy (in priority order):
 *  1. Upstash Redis — when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 *     (works across Vercel serverless instances, multiple users, all regions)
 *  2. Local file — data/db.json for local dev or single-server deployments
 *  3. In-memory only — last resort, data survives until process restart
 */

import fs from 'fs';
import path from 'path';
import { Order, SystemSettings, User, GoodItem } from './types';

/* ─────────────────────────────── Types ─────────────────────────────── */

interface DatabaseSchema {
  users: (User & { password?: string })[];
  orders: Order[];
  settings: SystemSettings;
}

/* ─────────────────────────────── Defaults ─────────────────────────── */

const DEFAULT_SETTINGS: SystemSettings = {
  dynamicFeePercent: 20,
  flatShippingFee: 0,
  currency: 'EGP',
  instapayAddress: 'shein.orders@instapay',
  instapayAccountName: 'SHEIN Concierge Egypt',
  vodafoneCashNumber: '01098765432',
  vodafoneCashInstructions:
    'أرسل المبلغ المطلوب إلى الرقم أعلاه عبر فودافون كاش، ثم أرفق لقطة الشاشة لتأكيد الدفع.',
  supportPhone: '+20 109 876 5432',
  announcementText:
    'خدمة SHEIN Concierge — رسوم خدمة 20%، متاح الدفع عبر InstaPay أو فودافون كاش.',
};

const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'user-admin',
    name: 'Admin Supervisor',
    email: 'admin@sheinextract.com',
    password: 'admin123456',
    role: 'admin',
    phone: '+20 100 000 0000',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin+Supervisor',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ORDERS: Order[] = [];

/* ────────────────────────── Upstash Redis Layer ───────────────────── */

type RedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

let _redis: RedisClient | null = null;

function getRedis(): RedisClient | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Lazy import — only runs when env vars exist
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    _redis = new Redis({ url, token }) as RedisClient;
    return _redis;
  } catch {
    return null;
  }
}

const REDIS_KEY = 'shein_concierge_db';

async function loadFromRedis(): Promise<DatabaseSchema | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(REDIS_KEY);
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as DatabaseSchema);
    return {
      users: parsed.users ?? DEFAULT_USERS,
      orders: parsed.orders ?? DEFAULT_ORDERS,
      settings: parsed.settings ?? DEFAULT_SETTINGS,
    };
  } catch (err) {
    console.warn('[DB] Redis read error:', err);
    return null;
  }
}

async function saveToRedis(data: DatabaseSchema): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(REDIS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[DB] Redis write error:', err);
  }
}

/* ──────────────────────────── File-based Layer ────────────────────── */

function getDbFilePath(): string {
  if (process.env.VERCEL) {
    return '/tmp/shein_db.json';
  }
  return path.join(process.cwd(), 'data', 'db.json');
}

function loadFromFile(): DatabaseSchema | null {
  try {
    const filePath = getDbFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users ?? DEFAULT_USERS,
        orders: parsed.orders ?? DEFAULT_ORDERS,
        settings: parsed.settings ?? DEFAULT_SETTINGS,
      };
    }
  } catch (err) {
    console.warn('[DB] File read error:', err);
  }
  return null;
}

function saveToFile(data: DatabaseSchema): void {
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    console.warn('[DB] File write error (in-memory only):', err);
  }
}

/* ──────────────────────────── In-memory Cache ─────────────────────── */

let memoryDb: DatabaseSchema | null = null;

function defaultDb(): DatabaseSchema {
  return {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    settings: DEFAULT_SETTINGS,
  };
}

/* ────────────────────────── Public async API ───────────────────────── */

async function ensureDb(): Promise<DatabaseSchema> {
  if (memoryDb) return memoryDb;

  // Try Redis first
  const fromRedis = await loadFromRedis();
  if (fromRedis) {
    memoryDb = fromRedis;
    return memoryDb;
  }

  // Try file
  const fromFile = loadFromFile();
  if (fromFile) {
    memoryDb = fromFile;
    return memoryDb;
  }

  // Use defaults
  memoryDb = defaultDb();

  // Persist initial state
  await persistDb(memoryDb);
  return memoryDb;
}

async function persistDb(data: DatabaseSchema): Promise<void> {
  memoryDb = data;
  // Prefer Redis if available
  if (getRedis()) {
    await saveToRedis(data);
  } else {
    saveToFile(data);
  }
}

/* ──────────────────────────── Data Access ──────────────────────────── */

export const db = {
  getUsers: async (): Promise<(User & { password?: string })[]> => {
    return (await ensureDb()).users;
  },

  getUserByEmail: async (email: string): Promise<(User & { password?: string }) | undefined> => {
    const lower = email.toLowerCase().trim();
    return (await ensureDb()).users.find((u) => u.email.toLowerCase() === lower);
  },

  getUserById: async (id: string): Promise<(User & { password?: string }) | undefined> => {
    return (await ensureDb()).users.find((u) => u.id === id);
  },

  createUser: async (user: User & { password?: string }): Promise<User> => {
    const data = await ensureDb();
    data.users.push(user);
    await persistDb(data);
    const { password, ...safe } = user;
    return safe;
  },

  getSettings: async (): Promise<SystemSettings> => {
    return (await ensureDb()).settings;
  },

  updateSettings: async (newSettings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const data = await ensureDb();
    data.settings = { ...data.settings, ...newSettings };
    await persistDb(data);
    return data.settings;
  },

  getOrders: async (filter?: { userId?: string; status?: string; search?: string }): Promise<Order[]> => {
    let list = (await ensureDb()).orders;

    if (filter?.userId) {
      list = list.filter((o) => o.userId === filter.userId);
    }

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((o) => o.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          o.userPhone.toLowerCase().includes(q) ||
          o.extractedLink.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    return (await ensureDb()).orders.find((o) => o.id === id);
  },

  createOrder: async (order: Order): Promise<Order> => {
    const data = await ensureDb();
    data.orders.unshift(order);
    await persistDb(data);
    return order;
  },

  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order | null> => {
    const data = await ensureDb();
    const index = data.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    const current = data.orders[index];
    const updated: Order = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If items were updated, recalculate subtotal and total cash dynamically
    if (updates.items) {
      const subtotal = updates.items.reduce((s, it) => s + it.subtotal, 0);
      const feePercent = updates.dynamicFeePercent ?? current.dynamicFeePercent;
      const feeAmount = Math.round(subtotal * (feePercent / 100));
      const shipping = updates.shippingFee ?? current.shippingFee;
      updated.itemsSubtotal = subtotal;
      updated.dynamicFeePercent = feePercent;
      updated.dynamicFeeAmount = feeAmount;
      updated.shippingFee = shipping;
      updated.totalCash = subtotal + feeAmount + shipping;
      updated.itemsCount = updates.items.length;
    }

    data.orders[index] = updated;
    await persistDb(data);
    return updated;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    const data = await ensureDb();
    const lenBefore = data.orders.length;
    data.orders = data.orders.filter((o) => o.id !== id);
    if (data.orders.length !== lenBefore) {
      await persistDb(data);
      return true;
    }
    return false;
  },

  /** Invalidate in-memory cache — forces next read to reload from Redis/file */
  invalidateCache: () => {
    memoryDb = null;
  },
};
