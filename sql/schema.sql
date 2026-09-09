-- ============================================================
-- Sri Sai Realty - Property Management
-- Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Ensure required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- ADMIN TABLE (Owner account - single admin)
-- Stored separately from Supabase Auth for simplicity.
-- The password hash is bcrypt (compatible with bcryptjs on server).
-- ============================================================
create table if not exists public.admin (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  password_hash text not null,            -- bcrypt hash (bcryptjs format)
  created_at   timestamptz not null default now()
);

-- ============================================================
-- PROPERTIES TABLE
-- Holds all property listing details
-- ============================================================
create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  -- Core listing fields
  name          text not null,            -- Property name (e.g. "Sai Residency")
  size          text not null default '', -- Property size (e.g. 2BHK, 3BHK)
  facing        text not null default '', -- Facing (North, South, East, West, North-East, etc.)
  khata         text not null default '', -- Khata type: A Khata / B Khata / Commercial
  place         text not null default '', -- Place / location
  road          text not null default '', -- Road width in feet in front
  loan          text not null default '', -- Existing loan: Yes / No
  available     text not null default '', -- Available for: Buy / Lease / Rent
  description   text not null default '', -- Brief explanation
  price         text not null default '', -- Price (free text, e.g. "₹1.2 Cr")
  status        text not null default 'Available',
  images        jsonb not null default '[]', -- array of public URLs
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- ENQUIRIES TABLE
-- Customer enquiries submitted from the website
-- ============================================================
create table if not exists public.enquiries (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null default '',
  email          text not null,
  phone          text not null,
  interest       text not null default '',
  budget         text not null default '',
  location       text not null default '',
  message        text not null default '',
  property_id    uuid references public.properties(id) on delete set null,
  property_title text not null default '',
  status         text not null default 'new', -- new / contacted / closed
  created_at     timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_set_properties_updated_at on public.properties;
create trigger trigger_set_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.admin      enable row level security;
alter table public.properties enable row level security;
alter table public.enquiries  enable row level security;

-- Public read access to properties (anyone can view listings)
drop policy if exists "properties_public_select" on public.properties;
create policy "properties_public_select"
  on public.properties for select
  using (true);

-- Writes to properties/enquiries/admin require a valid signed-in
-- application user. We gate the server side with JWT, and use a
-- single Postgres role here. For maximum security on Vercel, we run
-- the backend's Supabase client with the SERVICE_ROLE key which
-- bypasses RLS. The policies below are for direct Supabase access
-- safety (e.g. via the Supabase UI / table editor).

-- We do NOT enable RLS write policies, so the service role key
-- (used by the server) is the only path for writes.

-- Public insert to enquiries (customers submit the form)
drop policy if exists "enquiries_public_insert" on public.enquiries;
create policy "enquiries_public_insert"
  on public.enquiries for insert
  with check (true);

-- ============================================================
-- STORAGE BUCKET for property images
-- Run this separately, or create a bucket named "property-images"
-- via Dashboard > Storage > New bucket (set to Public).
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('property-images', 'property-images', true)
-- on conflict (id) do nothing;

-- ============================================================
-- SEED ADMIN ACCOUNT
-- IMPORTANT: Replace the placeholder hash below with the output
-- of the server's setup (see /sql/seed-admin.js) or use the
-- admin/setup.html page. Do NOT leave a weak default password.
-- ============================================================
-- insert into public.admin (username, password_hash)
-- values ('admin', '<bcrypt-hash>')
-- on conflict (username) do nothing;

-- ============================================================
-- OPTIONAL: Empty the sample/old property data (seeded locally)
-- ============================================================
-- delete from public.properties;
