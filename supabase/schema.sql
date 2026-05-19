-- Consignment WMS Schema
-- Run this in your Supabase SQL editor

-- DEALERS
create table if not exists dealers (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- PRODUCTS (shared catalog)
create table if not exists products (
  sku text primary key,
  name text not null,
  category text,
  srp numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- DEALER_PRODUCTS (threshold per dealer per SKU)
create table if not exists dealer_products (
  dealer_id text references dealers(id) on delete cascade,
  sku text references products(sku) on delete cascade,
  threshold integer default 0,
  primary key (dealer_id, sku)
);

-- MOVEMENTS
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  dealer_id text references dealers(id) on delete cascade,
  sku text references products(sku) on delete cascade,
  type text check (type in ('in','out')) not null,
  unit_type text check (unit_type in ('stock','show')) not null default 'stock',
  qty integer not null,
  date date not null default current_date,
  ref text,
  customer text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists movements_dealer_id_idx on movements(dealer_id);
create index if not exists movements_sku_idx on movements(sku);
create index if not exists movements_date_idx on movements(date);
create index if not exists movements_dealer_sku_idx on movements(dealer_id, sku);

alter table dealers disable row level security;
alter table products disable row level security;
alter table dealer_products disable row level security;
alter table movements disable row level security;
