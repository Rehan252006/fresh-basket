/*
  ============================================================
  SUPABASE SETUP — js/supabase.js
  Fresh Basket – Anantapur
  ============================================================

  BEFORE YOU START: Run these SQL queries in your Supabase
  project → SQL Editor → New Query → paste → Run

  ---------------------------------------------------------------
  CREATE TABLE profiles (
    id uuid references auth.users primary key,
    name text,
    phone text,
    role text default 'customer'
  );

  CREATE TABLE products (
    id uuid primary key default gen_random_uuid(),
    name text,
    price numeric,
    category text,
    image_url text,
    available boolean default true,
    created_at timestamp default now()
  );

  CREATE TABLE orders (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references profiles(id),
    customer_name text,
    customer_phone text,
    address text,
    pincode text,
    items jsonb,
    total numeric,
    status text default 'pending',
    created_at timestamp default now()
  );

  -- Enable realtime on orders table:
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ---------------------------------------------------------------

  HOW TO GET YOUR KEYS:
  1. Go to https://supabase.com and create a free project
  2. Go to Project Settings → API
  3. Copy "Project URL" → paste below as YOUR_SUPABASE_URL
  4. Copy "anon public" key → paste below as YOUR_SUPABASE_ANON_KEY
*/

const SUPABASE_URL = "https://wdxnlrlpqxxifirnvqoa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mZ0oYZMI-YPcj-BFc9tfDA_S9TQnFSa";

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);