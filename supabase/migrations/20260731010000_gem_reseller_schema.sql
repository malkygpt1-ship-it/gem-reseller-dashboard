-- GEM Imports -> eBay reseller data model.
-- Intentionally contains no seed data.

create extension if not exists pgcrypto;

create type public.gem_stock_status as enum ('in_stock', 'out_of_stock', 'unknown');
create type public.opportunity_status as enum ('Buy', 'Review', 'Avoid', 'Unresearched');
create type public.confidence_label as enum ('Very low', 'Low', 'Moderate', 'High', 'Very high');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  image_url text,
  gem_url text not null,
  gem_sku text,
  category text,
  description text not null default '',
  units_per_lot integer not null check (units_per_lot > 0),
  lot_cost_ex_vat numeric(12,2) not null check (lot_cost_ex_vat >= 0),
  lot_cost_inc_vat numeric(12,2) not null check (lot_cost_inc_vat >= 0),
  unit_cost_ex_vat numeric(12,4) not null check (unit_cost_ex_vat >= 0),
  unit_cost_inc_vat numeric(12,4) not null check (unit_cost_inc_vat >= 0),
  stock_status public.gem_stock_status not null default 'unknown',
  opportunity_status public.opportunity_status not null default 'Unresearched',
  notes text not null default '',
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, gem_url)
);

create table public.ebay_research (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  expected_selling_price numeric(12,2),
  average_sold_price numeric(12,2),
  lowest_sold_price numeric(12,2),
  highest_sold_price numeric(12,2),
  recent_sold_count integer check (recent_sold_count >= 0),
  active_listing_count integer check (active_listing_count >= 0),
  estimated_sell_through_rate numeric(7,3),
  sold_price_coefficient_of_variation numeric(7,4),
  confidence_score integer check (confidence_score between 0 and 100),
  confidence_label public.confidence_label,
  researched_at timestamptz,
  research_notes text not null default '',
  unique (product_id)
);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lot_cost_ex_vat numeric(12,2) not null,
  lot_cost_inc_vat numeric(12,2) not null,
  unit_cost_ex_vat numeric(12,4) not null,
  unit_cost_inc_vat numeric(12,4) not null,
  stock_status public.gem_stock_status not null default 'unknown',
  recorded_at timestamptz not null default now()
);

create table public.purchase_planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lot_quantity integer not null default 1 check (lot_quantity > 0),
  selected boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.products enable row level security;
alter table public.ebay_research enable row level security;
alter table public.price_history enable row level security;
alter table public.purchase_planner_items enable row level security;

create policy "Users manage own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own research" on public.ebay_research
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own price history" on public.price_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own planner" on public.purchase_planner_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index products_user_updated_idx on public.products (user_id, updated_at desc);
create index research_product_idx on public.ebay_research (product_id);
create index price_history_product_recorded_idx on public.price_history (product_id, recorded_at desc);
create index planner_user_selected_idx on public.purchase_planner_items (user_id, selected);
