-- ==============================================================================
-- Supabase Schema for SHEIN Concierge Egypt
-- Project Ref: sxcsgnzkgwctafqxkfdd
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create ORDERS table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  shipping_address TEXT,
  raw_input TEXT,
  extracted_link TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_count INT DEFAULT 0,
  items_subtotal NUMERIC DEFAULT 0,
  dynamic_fee_percent NUMERIC DEFAULT 20,
  dynamic_fee_amount NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  total_cash NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  admin_comment TEXT,
  payment JSONB,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create SETTINGS table
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  dynamic_fee_percent NUMERIC DEFAULT 20,
  flat_shipping_fee NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  instapay_address TEXT DEFAULT 'shein.orders@instapay',
  instapay_account_name TEXT DEFAULT 'SHEIN Concierge Egypt',
  vodafone_cash_number TEXT DEFAULT '01098765432',
  support_phone TEXT DEFAULT '+20 109 876 5432',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) with open read/write for service & anon client
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read & write via anon key
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access orders" ON public.orders;
CREATE POLICY "Public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access settings" ON public.settings;
CREATE POLICY "Public access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user if not exists
INSERT INTO public.users (id, name, email, password, role, phone, created_at)
VALUES (
  'user-admin',
  'Admin Supervisor',
  'admin@sheinextract.com',
  'admin123456',
  'admin',
  '+20 100 000 0000',
  NOW()
) ON CONFLICT (email) DO NOTHING;
