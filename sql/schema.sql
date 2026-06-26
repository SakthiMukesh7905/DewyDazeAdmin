-- ============================================================
-- Dewy Daze — products table
-- Run this in the Supabase SQL Editor before using the admin app.
-- ============================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Soap', 'Shampoo', 'Face Wash', 'Body Scrub')),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  description text,
  main_photo_url text,
  gallery_urls text[] default '{}',
  prep_time_days integer check (prep_time_days >= 0),
  ingredients text,
  created_at timestamptz not null default now()
);

-- Row Level Security: required since the app uses the public anon key.
alter table public.products enable row level security;

-- NOTE: This policy set is permissive (anyone with the anon key can read/write),
-- which matches "no login screen yet" admin tools. Before going live, swap these
-- for auth-scoped policies (e.g. using Supabase Auth + a check on auth.uid()),
-- or put this dashboard behind a separate login.
create policy "Public can read products"
  on public.products for select
  using (true);

create policy "Public can insert products"
  on public.products for insert
  with check (true);

create policy "Public can delete products"
  on public.products for delete
  using (true);

-- ============================================================
-- Storage bucket: product-images (Public)
-- Create the bucket via Dashboard > Storage > New Bucket, mark it Public,
-- then run the policies below so uploads/deletes work from the anon key.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Public can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images');
