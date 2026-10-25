/**
 * Persistent database layer with multi-level fallback:
 *  1. Upstash Redis (shared across all Vercel serverless instances when env vars exist)
 *  2. Local /tmp file (on Vercel) initialized from bundled data/db.json
 *  3. data/db.json (local file system)
 *  4. In-memory cache
 */

import fs from 'fs';
import path from 'path';
import { Order, SystemSettings, User, GoodItem } from './types';
import { RELIABLE_FASHION_IMAGES } from './shein-extractor';

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
  {
    id: 'user-sara',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    password: 'user123456',
    role: 'user',
    phone: '01019283746',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sara+Ahmed',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'SH-19036',
    userId: 'user-sara',
    userName: 'Sara Ahmed',
    userEmail: 'sara@example.com',
    userPhone: '01019283746',
    shippingAddress: '5 Street 250, Degla, Maadi, Cairo',
    rawInput: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    extractedLink: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    items: [
      {
        id: 'item-1',
        name: 'SHEIN Frenchy Solid Notch Neck Long Sleeve Top & Trousers Set',
        image: RELIABLE_FASHION_IMAGES[0],
        originalPrice: 650,
        currency: 'EGP',
        quantity: 1,
        subtotal: 650,
        adminComment: 'Size M in Mocha Brown confirmed in stock at regional fulfillment center',
      },
    ],
    itemsCount: 1,
    itemsSubtotal: 650,
    dynamicFeePercent: 20,
    dynamicFeeAmount: 130,
    shippingFee: 0,
    totalCash: 780,
    currency: 'EGP',
    status: 'APPROVED_PENDING_PAYMENT',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedBy: 'Admin Supervisor',
    reviewedAt: new Date(Date.now() - 3600000).toISOString(),
    adminComment: 'Accurately verified by supervisor. Cart is ready for payment.',
    payment: {
      method: 'vodafone_cash',
      senderIdentifier: '01019283746',
      transactionReference: 'VF-9482109',
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      adminNote: 'Payment confirmed by admin',
    },
  },
  {
    id: 'SH-89421',
    userId: 'user-sara',
    userName: 'Sara Ahmed',
    userEmail: 'sara@example.com',
    userPhone: '01019283746',
    shippingAddress: 'Building 14, St 9, Maadi, Cairo, Egypt',
    rawInput:
      'I found some great items at SHEIN!\nThese items in my shopping cart are great. I highly recommend them to everyone!\nhttps://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    extractedLink: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    cartShareCode: '2_RNmYr2Mxf4g',
    cartGroupId: '912245215',
    cartCoverImage: RELIABLE_FASHION_IMAGES[0],
    items: [
      {
        id: 'item-1',
        name: 'SHEIN Frenchy Solid Notch Neck Long Sleeve Top & Trousers Set',
        image: RELIABLE_FASHION_IMAGES[0],
        originalUrl: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
        sku: 'sz240819129532890',
        color: 'Mocha Brown',
        size: 'M',
        originalPrice: 650,
        currency: 'EGP',
        quantity: 1,
        subtotal: 650,
        status: 'available',
      },
      {
        id: 'item-2',
        name: 'SHEIN EZwear Casual Drop Shoulder Ribbed Knit Cardigan',
        image: RELIABLE_FASHION_IMAGES[1],
        originalUrl: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
        sku: 'sw23080447382910',
        color: 'Oatmeal Beige',
        size: 'L',
        originalPrice: 420,
        currency: 'EGP',
        quantity: 1,
        subtotal: 420,
        status: 'available',
      },
      {
        id: 'item-3',
        name: 'SHEIN Minimalist Quilted Shoulder Crossbody Bag With Chain',
        image: RELIABLE_FASHION_IMAGES[2],
        originalUrl: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
        sku: 'sg2310118837190',
        color: 'Classic Black',
        size: 'One Size',
        originalPrice: 380,
        currency: 'EGP',
        quantity: 1,
        subtotal: 380,
        status: 'available',
      },
    ],
    itemsCount: 3,
    itemsSubtotal: 1450,
    dynamicFeePercent: 20,
    dynamicFeeAmount: 290,
    shippingFee: 0,
    totalCash: 1740,
    currency: 'EGP',
    status: 'PENDING_APPROVAL',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

/* ────────────────────────── Upstash Redis Layer ───────────────────── */

type RedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

let _redis: RedisClient | null = null;

function getRedis(): RedisClient | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    _redis = new Redis({ url, token }) as RedisClient;
    return _redis;
  } catch {
    return null;
  }
}

const REDIS_KEY = 'shein_concierge_db_v2';

async function loadFromRedis(): Promise<DatabaseSchema | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(REDIS_KEY);
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as DatabaseSchema);
    return {
      users: parsed.users && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
      orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : DEFAULT_ORDERS,
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

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function getDbFilePath(): string {
  if (process.env.VERCEL) {
    return '/tmp/shein_db.json';
  }
  return LOCAL_DB_PATH;
}

function loadFromFile(): DatabaseSchema | null {
  const targetPath = getDbFilePath();

  // Try active target file first (e.g. /tmp/shein_db.json on Vercel)
  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          users: parsed.users && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
          orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : DEFAULT_ORDERS,
          settings: parsed.settings ?? DEFAULT_SETTINGS,
        };
      }
    }
  } catch (err) {
    console.warn('[DB] Target file read error:', err);
  }

  // Fallback to bundled data/db.json (seeds initial data on fresh serverless cold starts)
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          users: parsed.users && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
          orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : DEFAULT_ORDERS,
          settings: parsed.settings ?? DEFAULT_SETTINGS,
        };
      }
    }
  } catch (err) {
    console.warn('[DB] Bundled DB read error:', err);
  }

  return null;
}

function saveToFile(data: DatabaseSchema): void {
  const targetPath = getDbFilePath();
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${targetPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, targetPath);
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

  // 1. Try Redis
  const fromRedis = await loadFromRedis();
  if (fromRedis) {
    memoryDb = fromRedis;
    return memoryDb;
  }

  // 2. Try file
  const fromFile = loadFromFile();
  if (fromFile) {
    memoryDb = fromFile;
    return memoryDb;
  }

  // 3. Defaults
  memoryDb = defaultDb();
  await persistDb(memoryDb);
  return memoryDb;
}

async function persistDb(data: DatabaseSchema): Promise<void> {
  memoryDb = data;
  if (getRedis()) {
    await saveToRedis(data);
  }
  saveToFile(data);
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

  getOrders: async (filter?: {
    userId?: string;
    userEmail?: string;
    userPhone?: string;
    status?: string;
    search?: string;
  }): Promise<Order[]> => {
    let list = (await ensureDb()).orders;

    // Filter by user if specified (matches userId, userEmail, or userPhone)
    if (filter?.userId || filter?.userEmail || filter?.userPhone) {
      list = list.filter((o) => {
        if (filter.userId && o.userId === filter.userId) return true;
        if (
          filter.userEmail &&
          o.userEmail &&
          o.userEmail.toLowerCase() === filter.userEmail.toLowerCase()
        )
          return true;
        if (filter.userPhone && o.userPhone && o.userPhone === filter.userPhone) return true;
        return false;
      });
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
    // Check if order already exists
    const existingIndex = data.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      data.orders[existingIndex] = order;
    } else {
      data.orders.unshift(order);
    }
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

    // Recalculate subtotal and total cash if items changed
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

  invalidateCache: () => {
    memoryDb = null;
  },
};
