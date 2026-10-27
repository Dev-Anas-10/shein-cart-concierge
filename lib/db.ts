/**
 * Persistent database layer with multi-level fallback:
 *  1. Upstash Redis (shared across all Vercel serverless instances when env vars exist)
 *  2. Local /tmp file (on Vercel) initialized from bundled data/db.json
 *  3. data/db.json (local file system)
 *  4. In-memory cache
 */

import fs from 'fs';
import path from 'path';
import { Order, SystemSettings, User, GoodItem, Shipment, ShipmentStatus } from './types';
import { RELIABLE_FASHION_IMAGES } from './shein-extractor';
import { normalizeOrderLinks } from './shein-links';
import { getSupabase } from './supabase';

/* ─────────────────────────────── Types ─────────────────────────────── */

interface DatabaseSchema {
  users: (User & { password?: string })[];
  orders: Order[];
  shipments: Shipment[];
  settings: SystemSettings;
}

/* ─────────────────────────────── Defaults ─────────────────────────── */

const DEFAULT_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-202610-01',
    code: 'شحنة نهاية أكتوبر (دفعة 1)',
    status: 'PREPARING',
    maxItems: 40,
    maxOrders: 10,
    carrier: 'Aramex',
    trackingNumber: 'ARX-89302194EG',
    estimatedArrival: '2026-11-05',
    notes: 'تجميع طلبيات نهاية شهر أكتوبر - الشحن الجوي السريع',
    orderIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  dynamicFeePercent: 0,
  profitMarginPercent: 10,
  flatShippingFee: 0,
  currency: 'EGP',
  sarToEgpRate: 15.0,
  usdToEgpRate: 50.0,
  showPaymentInSupport: true,
  enableInstapay: true,
  instapayAddress: 'anasashraf10@instapay',
  instapayAccountName: 'anasashraf10',
  instapayPaymentUrl: 'https://ipn.eg/S/anasashraf10/instapay/6OaEAR',
  enableVodafoneCash: true,
  vodafoneCashNumber: '01284947782',
  vodafoneCashInstructions:
    'أرسل المبلغ المطلوب إلى الرقم أعلاه عبر فودافون كاش، ثم أرفق لقطة الشاشة لتأكيد الدفع.',
  secondaryWalletNumber: '01284947782',
  secondaryWalletName: 'محفظة كاش إضافية',
  supportPhone: '+20 128 494 7782',
  supportWhatsapp: '+201284947782',
  supportEmail: 'gamallahmedd01@gmail.com',
  supportHours: 'يومياً من ٩:٠٠ صباحاً حتى ١١:٠٠ مساءً (بتوقيت القاهرة)',
  announcementEnabled: true,
  announcementText:
    'خدمة SHEIN Concierge — تسوق من شي إن والدفع بالجنيه المصري عبر InstaPay أو فودافون كاش وتوصيل لكافة محافظات مصر.',
  announcementBg: 'purple',
  heroBadge: 'الخدمة الرسمية والأسرع في مصر',
  heroTitle: 'استخرج سلة شي إن الخاصة بك وادفع بالجنيه المصري',
  heroSubtitle: 'الصق رابط سلة المشاركة، نتحقق من المقاسات والأسعار، وادفع بأمان عبر إنستاباي أو فودافون كاش مع شحن موثوق لباب بيتك.',
  howItWorksEnabled: true,
  step1Title: 'انسخ رابط السلة من شي إن',
  step1Desc: 'اضغط على زر المشاركة داخل تطبيق SHEIN وانسخ الرابط المختصر أو الرمز.',
  step2Title: 'مراجعة وتأكيد المقاسات',
  step2Desc: 'يقوم المشرف بفحص الأسعار، التخفيضات، وتوفر المقاسات في مصر.',
  step3Title: 'ادفع بالجنيه واستلم',
  step3Desc: 'سدد القيمة عبر إنستاباي أو فودافون كاش وتتبع شحنتك حتى باب المنزل.',
  trustMetricsEnabled: true,
  customSections: [
    {
      id: 'sec-payment-guarantee',
      title: 'ضمان الدفع الآمن والتوصيل في مصر',
      subtitle: 'حماية كاملة لأموالك ومرونة الدفع بالعملة المحلية مع فواتير تفصيلية',
      badge: 'ضمان وأمان 100%',
      type: 'cards',
      position: 'middle',
      theme: 'purple',
      enabled: true,
      cards: [
        {
          id: 'card-1',
          title: 'دفع بالجنيه المصري',
          desc: 'بدون بطاقات دولية أو حدود مصرفية عبر إنستاباي وفودافون كاش.',
          icon: 'ShieldCheck',
        },
        {
          id: 'card-2',
          title: 'فحص فوري للأصناف',
          desc: 'مراجعة دقيقة لتوفر المقاسات والألوان وتطبيق أحدث كوبونات شي إن.',
          icon: 'CheckCircle2',
        },
        {
          id: 'card-3',
          title: 'شحن سريع ومضمون',
          desc: 'توصيل لجميع محافظات مصر مع إشعارات مباشرة لحالة الشحنة.',
          icon: 'Truck',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
};

const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'user-admin',
    name: 'Admin Supervisor',
    email: 'admin@sheinextract.com',
    password: '$2b$10$XdSsrm.koBl9/5KrNmz5MudI1TlJ9ev8fgC9mx6XAjgVFRtmV61Be',
    role: 'admin',
    phone: '+20 100 000 0000',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin+Supervisor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sara',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    password: '$2b$10$9fkZ2LEzi64ml5Sgn60R.e8P89gqVI.y/mlA0f9A8XsMryuT0Vdj2',
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
    extractedLink: 'https://m.shein.com/ar/cart/share/landing?group_id=912245215&shc=2_RNmYr2Mxf4g&local_country=SA&cart_share=1',
    cartShareCode: '2_RNmYr2Mxf4g',
    cartGroupId: '912245215',
    cartCoverImage: RELIABLE_FASHION_IMAGES[0],
    items: [
      {
        id: 'item-1',
        name: 'SHEIN Frenchy Solid Notch Neck Long Sleeve Top & Trousers Set',
        image: RELIABLE_FASHION_IMAGES[0],
        originalUrl: 'https://m.shein.com/ar/cart/share/landing?group_id=912245215&shc=2_RNmYr2Mxf4g&local_country=SA&cart_share=1',
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
        originalUrl: 'https://m.shein.com/ar/cart/share/landing?group_id=912245215&shc=2_RNmYr2Mxf4g&local_country=SA&cart_share=1',
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
        originalUrl: 'https://m.shein.com/ar/cart/share/landing?group_id=912245215&shc=2_RNmYr2Mxf4g&local_country=SA&cart_share=1',
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
      shipments: parsed.shipments && parsed.shipments.length > 0 ? parsed.shipments : DEFAULT_SHIPMENTS,
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

/* ────────────────────────── Supabase Layer ───────────────────────── */

function mapRowToOrder(row: any): Order {
  return normalizeOrderLinks({
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ''),
    userName: String(row.user_name ?? row.userName ?? ''),
    userEmail: String(row.user_email ?? row.userEmail ?? ''),
    userPhone: String(row.user_phone ?? row.userPhone ?? ''),
    shippingAddress: row.shipping_address ?? row.shippingAddress ?? undefined,
    rawInput: String(row.raw_input ?? row.rawInput ?? ''),
    extractedLink: String(row.extracted_link ?? row.extractedLink ?? ''),
    cartShareCode: row.cart_share_code ?? row.cartShareCode ?? undefined,
    cartGroupId: row.cart_group_id ?? row.cartGroupId ?? undefined,
    cartCoverImage: row.cart_cover_image ?? row.cartCoverImage ?? undefined,
    items: Array.isArray(row.items) ? row.items : [],
    itemsCount: Number(row.items_count ?? row.itemsCount ?? (Array.isArray(row.items) ? row.items.length : 0)),
    itemsSubtotal: Number(row.items_subtotal ?? row.itemsSubtotal ?? 0),
    dynamicFeePercent: Number(row.dynamic_fee_percent ?? row.dynamicFeePercent ?? 0),
    dynamicFeeAmount: Number(row.dynamic_fee_amount ?? row.dynamicFeeAmount ?? 0),
    shippingFee: Number(row.shipping_fee ?? row.shippingFee ?? 0),
    totalCash: Number(row.total_cash ?? row.totalCash ?? 0),
    currency: String(row.currency ?? 'EGP'),
    status: row.status ?? 'PENDING_APPROVAL',
    customerNotes: row.customer_notes ?? row.customerNotes ?? undefined,
    shipmentId: row.shipment_id ?? row.shipmentId ?? undefined,
    shipmentCode: row.shipment_code ?? row.shipmentCode ?? undefined,
    adminComment: row.admin_comment ?? row.adminComment ?? undefined,
    payment: row.payment ?? undefined,
    reviewedBy: row.reviewed_by ?? row.reviewedBy ?? undefined,
    reviewedAt: row.reviewed_at ?? row.reviewedAt ?? undefined,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  });
}

function mapRowToUser(row: any): User & { password?: string } {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email).toLowerCase(),
    password: row.password ?? undefined,
    role: (row.role === 'admin' ? 'admin' : 'user'),
    phone: row.phone ?? '',
    address: row.address ?? row.shipping_address ?? '',
    city: row.city ?? '',
    avatar: row.avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name || 'User')}`,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? undefined,
  };
}

async function loadFromSupabase(): Promise<DatabaseSchema | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [ordersRes, usersRes] = await Promise.all([
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      sb.from('users').select('*'),
    ]);

    if (usersRes.error) {
      console.warn('[Supabase] Users read error:', usersRes.error.message);
    }
    if (ordersRes.error) {
      console.warn('[Supabase] Orders read error:', ordersRes.error.message);
    }

    const users = usersRes.data && usersRes.data.length > 0 ? usersRes.data.map(mapRowToUser) : DEFAULT_USERS;
    const orders = ordersRes.data && ordersRes.data.length > 0 ? ordersRes.data.map(mapRowToOrder) : DEFAULT_ORDERS;

    const fileFallback = loadFromFile();
    const shipments = fileFallback && fileFallback.shipments && fileFallback.shipments.length > 0 ? fileFallback.shipments : DEFAULT_SHIPMENTS;
    const settings = fileFallback?.settings ?? DEFAULT_SETTINGS;

    return {
      users,
      orders,
      shipments,
      settings,
    };
  } catch (err) {
    console.warn('[Supabase] Read note:', err);
    return null;
  }
}

async function syncUserToSupabase(user: User & { password?: string }): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const payload: any = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar,
      created_at: user.createdAt,
    };
    if (user.address) payload.address = user.address;
    if (user.city) payload.city = user.city;
    if (user.lastLoginAt) {
      payload.last_login_at = user.lastLoginAt;
    }
    const { error } = await sb.from('users').upsert(payload);
    if (error) {
      console.warn('[Supabase] User upsert note:', error.message);
    } else {
      console.log('[Supabase] User synced successfully:', user.email);
    }
  } catch (err) {
    console.warn('[Supabase] User upsert exception:', err);
  }
}

async function syncOrderToSupabase(order: Order): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('orders').upsert({
      id: order.id,
      user_id: order.userId,
      user_name: order.userName,
      user_email: order.userEmail,
      user_phone: order.userPhone,
      shipping_address: order.shippingAddress || null,
      raw_input: order.rawInput,
      extracted_link: order.extractedLink,
      items: order.items,
      items_count: order.itemsCount,
      items_subtotal: order.itemsSubtotal,
      dynamic_fee_percent: order.dynamicFeePercent,
      dynamic_fee_amount: order.dynamicFeeAmount,
      shipping_fee: order.shippingFee || 0,
      total_cash: order.totalCash,
      currency: order.currency || 'EGP',
      status: order.status,
      admin_comment: order.adminComment || null,
      payment: order.payment || null,
      reviewed_by: order.reviewedBy || null,
      reviewed_at: order.reviewedAt || null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    });
    if (error) {
      console.warn('[Supabase] Order upsert error:', error.message);
    } else {
      console.log('[Supabase] Order synced successfully:', order.id);
    }
  } catch (err) {
    console.warn('[Supabase] Upsert note:', err);
  }
}

async function deleteOrderFromSupabase(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('orders').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Delete note:', err);
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
          shipments: parsed.shipments && parsed.shipments.length > 0 ? parsed.shipments : DEFAULT_SHIPMENTS,
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
          shipments: parsed.shipments && parsed.shipments.length > 0 ? parsed.shipments : DEFAULT_SHIPMENTS,
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
    shipments: DEFAULT_SHIPMENTS,
    settings: DEFAULT_SETTINGS,
  };
}

/* ────────────────────────── Public async API ───────────────────────── */

async function ensureDb(forceRefresh = false): Promise<DatabaseSchema> {
  if (memoryDb && !forceRefresh) return memoryDb;

  // 1. Try Supabase (primary source of truth for multi-user sync)
  const fromSupabase = await loadFromSupabase();
  if (fromSupabase) {
    memoryDb = fromSupabase;
    saveToFile(memoryDb);
    return memoryDb;
  }

  // 2. Try Redis
  const fromRedis = await loadFromRedis();
  if (fromRedis) {
    memoryDb = fromRedis;
    return memoryDb;
  }

  // 3. Try file
  const fromFile = loadFromFile();
  if (fromFile) {
    memoryDb = fromFile;
    return memoryDb;
  }

  // 4. Defaults
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
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*');
        if (data && !error && data.length > 0) {
          return data.map(mapRowToUser);
        }
      } catch (err) {
        console.warn('[DB] Supabase getUsers fallback:', err);
      }
    }
    return (await ensureDb()).users;
  },

  getUserByEmail: async (email: string): Promise<(User & { password?: string }) | undefined> => {
    const lower = email.toLowerCase().trim();
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*').eq('email', lower).maybeSingle();
        if (data && !error) {
          const mapped = mapRowToUser(data);
          const currentData = await ensureDb();
          const idx = currentData.users.findIndex((u) => u.email.toLowerCase() === lower);
          if (idx >= 0) {
            currentData.users[idx] = mapped;
          } else {
            currentData.users.push(mapped);
          }
          return mapped;
        }
      } catch (err) {
        console.warn('[DB] Supabase user lookup fallback:', err);
      }
    }
    return (await ensureDb()).users.find((u) => u.email.toLowerCase() === lower);
  },

  getUserById: async (id: string): Promise<(User & { password?: string }) | undefined> => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
        if (data && !error) {
          return mapRowToUser(data);
        }
      } catch (err) {
        console.warn('[DB] Supabase getUserById fallback:', err);
      }
    }
    return (await ensureDb()).users.find((u) => u.id === id);
  },

  createUser: async (user: User & { password?: string }): Promise<User> => {
    const data = await ensureDb();
    data.users.push(user);
    await persistDb(data);
    await syncUserToSupabase(user);
    const { password, ...safe } = user;
    return safe;
  },

  updateUser: async (
    id: string,
    updates: Partial<User & { password?: string }>
  ): Promise<User | undefined> => {
    const data = await ensureDb();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      const sb = getSupabase();
      if (sb) {
        try {
          const payload: any = {};
          if (updates.name) payload.name = updates.name;
          if (updates.password) payload.password = updates.password;
          if (updates.phone) payload.phone = updates.phone;
          if (updates.address) payload.address = updates.address;
          if (updates.city) payload.city = updates.city;
          if (updates.lastLoginAt) payload.last_login_at = updates.lastLoginAt;
          await sb.from('users').update(payload).eq('id', id);
        } catch (e) {
          console.warn('[DB] Supabase updateUser direct fallback:', e);
        }
      }
      return undefined;
    }
    const updated = { ...data.users[idx], ...updates };
    data.users[idx] = updated;
    await persistDb(data);
    await syncUserToSupabase(updated);
    const { password, ...safe } = updated;
    return safe;
  },

  recordUserLogin: async (id: string): Promise<string> => {
    const now = new Date().toISOString();
    const data = await ensureDb();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      data.users[idx].lastLoginAt = now;
      await persistDb(data);
      await syncUserToSupabase(data.users[idx]);
    } else {
      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('users').update({ last_login_at: now }).eq('id', id);
        } catch (e) {
          console.warn('[DB] Supabase recordUserLogin error:', e);
        }
      }
    }
    return now;
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
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('orders').select('*').order('created_at', { ascending: false });
        if (filter?.status && filter.status !== 'ALL') {
          query = query.eq('status', filter.status);
        }
        const { data, error } = await query;
        if (data && !error) {
          let list = data.map(mapRowToOrder);
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
          return list;
        }
      } catch (err) {
        console.warn('[DB] Supabase getOrders fallback:', err);
      }
    }

    let list = (await ensureDb()).orders;

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

    return list.map(normalizeOrderLinks).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
        if (data && !error) {
          return mapRowToOrder(data);
        }
      } catch (err) {
        console.warn('[DB] Supabase getOrderById fallback:', err);
      }
    }
    const found = (await ensureDb()).orders.find((o) => o.id === id);

    return found ? normalizeOrderLinks(found) : undefined;
  },

  createOrder: async (order: Order): Promise<Order> => {
    const data = await ensureDb();
    const existingIndex = data.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      data.orders[existingIndex] = order;
    } else {
      data.orders.unshift(order);
    }
    await persistDb(data);
    await syncOrderToSupabase(order);
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

    if (updates.items) {
      const activeItems = updates.items.filter((it) => it.status !== 'rejected' && it.status !== 'out_of_stock');
      const subtotal = activeItems.reduce((s, it) => s + it.subtotal, 0);
      const feePercent = updates.dynamicFeePercent ?? current.dynamicFeePercent;
      const feeAmount = Math.round(subtotal * (feePercent / 100));
      const shipping = updates.shippingFee ?? current.shippingFee;
      updated.itemsSubtotal = subtotal;
      updated.dynamicFeePercent = feePercent;
      updated.dynamicFeeAmount = feeAmount;
      updated.shippingFee = shipping;
      updated.totalCash = subtotal + feeAmount + shipping;
      updated.itemsCount = activeItems.length;
    }

    data.orders[index] = updated;
    await persistDb(data);
    await syncOrderToSupabase(updated);
    return updated;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    const data = await ensureDb();
    const lenBefore = data.orders.length;
    data.orders = data.orders.filter((o) => o.id !== id);
    await deleteOrderFromSupabase(id);
    if (data.orders.length !== lenBefore) {
      await persistDb(data);
      return true;
    }
    return true;
  },

  // ── Shipments / Consignments Operations ──
  getShipments: async (): Promise<Shipment[]> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    return data.shipments;
  },

  getShipmentById: async (id: string): Promise<Shipment | undefined> => {
    const data = await ensureDb();
    return (data.shipments || []).find((s) => s.id === id);
  },

  createShipment: async (shipment: Shipment): Promise<Shipment> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    const existingIndex = data.shipments.findIndex((s) => s.id === shipment.id);
    if (existingIndex >= 0) {
      data.shipments[existingIndex] = shipment;
    } else {
      data.shipments.unshift(shipment);
    }
    await persistDb(data);
    return shipment;
  },

  updateShipment: async (id: string, updates: Partial<Shipment>): Promise<Shipment | null> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    const index = data.shipments.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const current = data.shipments[index];
    const updated: Shipment = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If shipment code changed, update code on all assigned orders
    if (updates.code && updates.code !== current.code) {
      data.orders.forEach((o) => {
        if (o.shipmentId === id) {
          o.shipmentCode = updates.code;
        }
      });
    }

    data.shipments[index] = updated;
    await persistDb(data);
    return updated;
  },

  deleteShipment: async (id: string): Promise<boolean> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    const beforeLen = data.shipments.length;
    data.shipments = data.shipments.filter((s) => s.id !== id);
    // Unassign orders that belonged to this shipment
    data.orders.forEach((o) => {
      if (o.shipmentId === id) {
        o.shipmentId = undefined;
        o.shipmentCode = undefined;
      }
    });
    if (data.shipments.length !== beforeLen) {
      await persistDb(data);
      return true;
    }
    return true;
  },

  assignOrdersToShipment: async (
    shipmentId: string,
    orderIds: string[]
  ): Promise<{ shipment: Shipment; updatedOrdersCount: number } | null> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    const shipment = data.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    if (!shipment.orderIds) shipment.orderIds = [];
    const orderSet = new Set(shipment.orderIds);
    let updatedCount = 0;

    for (const oid of orderIds) {
      orderSet.add(oid);
      const order = data.orders.find((o) => o.id === oid);
      if (order) {
        order.shipmentId = shipment.id;
        order.shipmentCode = shipment.code;
        order.updatedAt = new Date().toISOString();
        updatedCount++;
        await syncOrderToSupabase(order);
      }
    }

    shipment.orderIds = Array.from(orderSet);
    shipment.updatedAt = new Date().toISOString();
    await persistDb(data);
    return { shipment, updatedOrdersCount: updatedCount };
  },

  removeOrdersFromShipment: async (
    shipmentId: string,
    orderIds: string[]
  ): Promise<{ shipment: Shipment; removedCount: number } | null> => {
    const data = await ensureDb();
    if (!data.shipments) data.shipments = [];
    const shipment = data.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return null;

    const toRemoveSet = new Set(orderIds);
    shipment.orderIds = (shipment.orderIds || []).filter((oid) => !toRemoveSet.has(oid));
    let removedCount = 0;

    for (const oid of orderIds) {
      const order = data.orders.find((o) => o.id === oid);
      if (order && order.shipmentId === shipmentId) {
        order.shipmentId = undefined;
        order.shipmentCode = undefined;
        order.updatedAt = new Date().toISOString();
        removedCount++;
        await syncOrderToSupabase(order);
      }
    }

    shipment.updatedAt = new Date().toISOString();
    await persistDb(data);
    return { shipment, removedCount };
  },

  invalidateCache: () => {
    memoryDb = null;
  },
};
