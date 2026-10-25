import fs from 'fs';
import path from 'path';
import { Order, SystemSettings, User, GoodItem } from './types';

interface DatabaseSchema {
  users: (User & { password?: string })[];
  orders: Order[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_SETTINGS: SystemSettings = {
  dynamicFeePercent: 20,
  flatShippingFee: 0,
  currency: 'EGP',
  instapayAddress: 'shein.orders@instapay',
  instapayAccountName: 'SHEIN Concierge Egypt',
  vodafoneCashNumber: '01098765432',
  vodafoneCashInstructions:
    'حول المبلغ الإجمالي عبر فودافون كاش إلى الرقم الموضح أعلاه (*9*7*الرقم*المبلغ#)، ثم ارفع لقطة شاشة لإشعار التحويل لتأكيد طلبك.',
  supportPhone: '+20 109 876 5432',
  announcementText: 'طلبك من شي إن بأسهل طريقة - رسوم خدمة ديناميكية 20%، والدفع عبر إنستاباي أو فودافون كاش',
};

const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'user-admin',
    name: 'Admin Supervisor',
    email: 'admin@sheinextract.com',
    password: 'admin123456',
    role: 'admin',
    phone: '+20 100 000 0000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sara',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    password: 'user123456',
    role: 'user',
    phone: '01019283746',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ORDERS: Order[] = [
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
    cartCoverImage: 'https://img.ltwebstatic.com/v4/j/pics3/2026/10/25/ab/17928660625fb2f6947b5eb61cedcd79b60f00ff76.jpg',
    items: [
      {
        id: 'item-1',
        name: 'SHEIN Frenchy Solid Notch Neck Long Sleeve Top & Trousers Set',
        image: 'https://img.ltwebstatic.com/v4/j/pics3/2026/10/25/ab/17928660625fb2f6947b5eb61cedcd79b60f00ff76.jpg',
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
        image: 'https://img.ltwebstatic.com/images3_pi/2023/09/19/22/1695092795c65a585721869e5d4cb9c8c4c379a0b0_thumbnail_720x.webp',
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
        image: 'https://img.ltwebstatic.com/images3_pi/2023/11/02/33/1698912450551079d20c5c4e9cb4dcb0131481a5a5_thumbnail_720x.webp',
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
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'SH-72109',
    userId: 'user-sara',
    userName: 'Sara Ahmed',
    userEmail: 'sara@example.com',
    userPhone: '01019283746',
    shippingAddress: 'Nasr City, Zone 6, Cairo',
    rawInput: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    extractedLink: 'https://onelink.shein.com/58/662zlco9zrsd?shc=2_RNmYr2Mxf4g',
    items: [
      {
        id: 'item-sample-1',
        name: 'SHEIN Elegant Lapel Collar Double Breasted Blazer Coat',
        image: 'https://img.ltwebstatic.com/images3_pi/2023/10/16/e0/1697424911d3d63bdfbc71a5fbcf1ae477459be398_thumbnail_720x.webp',
        color: 'Creamy White',
        size: 'M',
        originalPrice: 950,
        currency: 'EGP',
        quantity: 1,
        subtotal: 950,
        status: 'available',
        adminComment: 'Original SHEIN price verified. Item is in stock at Dubai hub.',
      },
      {
        id: 'item-sample-2',
        name: 'SHEIN High Waist Straight Leg Tailored Pants',
        image: 'https://img.ltwebstatic.com/images3_pi/2023/09/27/ef/16957805244beeb8c29b71a257f893d7c355fc2c1c_thumbnail_720x.webp',
        color: 'Black',
        size: 'M',
        originalPrice: 550,
        currency: 'EGP',
        quantity: 1,
        subtotal: 550,
        status: 'available',
        adminComment: 'Stock confirmed. Fits true to size.',
      },
    ],
    itemsCount: 2,
    itemsSubtotal: 1500,
    dynamicFeePercent: 20,
    dynamicFeeAmount: 300,
    shippingFee: 0,
    totalCash: 1800,
    currency: 'EGP',
    status: 'APPROVED_PENDING_PAYMENT',
    adminComment:
      'We have accurately reviewed your cart! Both goods are in stock and 20% concierge fee applied. Please transfer 1800 EGP via InstaPay or Vodafone Cash and upload the receipt.',
    reviewedBy: 'Admin Supervisor',
    reviewedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

let memoryDb: DatabaseSchema | null = null;

function getDbFilePath(): string {
  // If running on Vercel or read-only filesystem, use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'shein_db.json');
  }
  return DB_FILE;
}

function ensureDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  const targetFile = getDbFilePath();

  // Try to load from targetFile or fallback to bundled DB_FILE
  try {
    if (fs.existsSync(targetFile)) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryDb = {
        users: parsed.users || DEFAULT_USERS,
        orders: parsed.orders || DEFAULT_ORDERS,
        settings: parsed.settings || DEFAULT_SETTINGS,
      };
      return memoryDb;
    }
  } catch (err) {
    console.warn('Could not read from targetFile, trying initial seed:', err);
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryDb = {
        users: parsed.users || DEFAULT_USERS,
        orders: parsed.orders || DEFAULT_ORDERS,
        settings: parsed.settings || DEFAULT_SETTINGS,
      };
      return memoryDb;
    }
  } catch (err) {
    console.warn('Could not read bundled DB_FILE:', err);
  }

  // Fallback to default
  memoryDb = {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    settings: DEFAULT_SETTINGS,
  };

  try {
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only errors on serverless
  }

  return memoryDb;
}

function saveDb(data: DatabaseSchema): void {
  memoryDb = data;
  const targetFile = getDbFilePath();

  try {
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${targetFile}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, targetFile);
  } catch (err) {
    console.warn('Warning: Could not persist to disk, retained in memory:', err);
  }
}

// Data Access API
export const db = {
  getUsers: (): (User & { password?: string })[] => {
    return ensureDb().users;
  },

  getUserByEmail: (email: string): (User & { password?: string }) | undefined => {
    const lower = email.toLowerCase().trim();
    return ensureDb().users.find((u) => u.email.toLowerCase() === lower);
  },

  getUserById: (id: string): (User & { password?: string }) | undefined => {
    return ensureDb().users.find((u) => u.id === id);
  },

  createUser: (user: User & { password?: string }): User => {
    const data = ensureDb();
    data.users.push(user);
    saveDb(data);
    const { password, ...safe } = user;
    return safe;
  },

  getSettings: (): SystemSettings => {
    return ensureDb().settings;
  },

  updateSettings: (newSettings: Partial<SystemSettings>): SystemSettings => {
    const data = ensureDb();
    data.settings = { ...data.settings, ...newSettings };
    saveDb(data);
    return data.settings;
  },

  getOrders: (filter?: { userId?: string; status?: string; search?: string }): Order[] => {
    let list = ensureDb().orders;

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

  getOrderById: (id: string): Order | undefined => {
    return ensureDb().orders.find((o) => o.id === id);
  },

  createOrder: (order: Order): Order => {
    const data = ensureDb();
    data.orders.unshift(order);
    saveDb(data);
    return order;
  },

  updateOrder: (id: string, updates: Partial<Order>): Order | null => {
    const data = ensureDb();
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
    saveDb(data);
    return updated;
  },

  deleteOrder: (id: string): boolean => {
    const data = ensureDb();
    const lenBefore = data.orders.length;
    data.orders = data.orders.filter((o) => o.id !== id);
    if (data.orders.length !== lenBefore) {
      saveDb(data);
      return true;
    }
    return false;
  },
};
