-- VibeCheck core production schema.
-- Designed for public card reads, private creator controls, verified payments,
-- Supabase Storage uploads, Realtime tracker feeds, and clean analytics.

create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete set null,
  recipient_name text not null check (char_length(recipient_name) between 1 and 80),
  creator_name text not null check (char_length(creator_name) between 1 and 80),
  template_type text not null check (char_length(template_type) between 1 and 60),
  theme_selected text not null default 'midnight_romance' check (char_length(theme_selected) between 1 and 60),
  card_data jsonb not null default '{}'::jsonb,
  tier_selected text not null check (char_length(tier_selected) between 1 and 40),
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'disabled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  is_paid boolean not null default false,
  payment_id text,
  music_track_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_secrets (
  card_id uuid primary key references public.cards(id) on delete cascade,
  passcode_salt text not null,
  passcode_hash text not null,
  unlock_question text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  sender text not null check (sender in ('creator', 'recipient')),
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.tracker_events (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'card_viewed',
      'envelope_opened',
      'passcode_failed',
      'passcode_unlocked',
      'runaway_dodged',
      'cta_accepted'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  bucket text not null,
  object_path text not null,
  original_filename text not null,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 8388608),
  status text not null default 'pending' check (status in ('pending', 'ready', 'deleted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text unique,
  amount_in_paise integer check (amount_in_paise is null or amount_in_paise > 0),
  currency text not null default 'INR',
  status text not null check (status in ('created', 'authorized', 'paid', 'failed', 'refunded')),
  raw_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cards_status_expires_idx on public.cards(status, expires_at);
create index if not exists cards_created_at_idx on public.cards(created_at desc);
create index if not exists messages_card_created_idx on public.messages(card_id, created_at);
create index if not exists tracker_events_card_created_idx on public.tracker_events(card_id, created_at);
create index if not exists tracker_events_type_created_idx on public.tracker_events(event_type, created_at);
create index if not exists uploads_card_idx on public.uploads(card_id, created_at);
create index if not exists payments_card_idx on public.payments(card_id, created_at);
create index if not exists payments_provider_order_idx on public.payments(provider_order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cards_updated_at on public.cards;
create trigger set_cards_updated_at
before update on public.cards
for each row
execute function public.set_updated_at();

alter table public.cards enable row level security;
alter table public.card_secrets enable row level security;
alter table public.messages enable row level security;
alter table public.tracker_events enable row level security;
alter table public.uploads enable row level security;
alter table public.payments enable row level security;

drop policy if exists "public can read active paid cards" on public.cards;
create policy "public can read active paid cards"
on public.cards
for select
to anon, authenticated
using (
  is_paid = true
  and status in ('draft', 'active')
  and (expires_at is null or expires_at > now())
);

drop policy if exists "creators can read own cards" on public.cards;
create policy "creators can read own cards"
on public.cards
for select
to authenticated
using (creator_id = auth.uid());

drop policy if exists "creators can update own cards" on public.cards;
create policy "creators can update own cards"
on public.cards
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "card secrets stay server only" on public.card_secrets;
create policy "card secrets stay server only"
on public.card_secrets
for all
using (false)
with check (false);

drop policy if exists "public can insert recipient messages" on public.messages;
create policy "public can insert recipient messages"
on public.messages
for insert
to anon, authenticated
with check (
  sender = 'recipient'
  and exists (
    select 1 from public.cards c
    where c.id = card_id
    and c.is_paid = true
    and c.status in ('draft', 'active')
    and (c.expires_at is null or c.expires_at > now())
  )
);

drop policy if exists "public can read messages for active cards" on public.messages;
create policy "public can read messages for active cards"
on public.messages
for select
to anon, authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
    and c.is_paid = true
    and c.status in ('draft', 'active')
    and (c.expires_at is null or c.expires_at > now())
  )
);

drop policy if exists "public can insert tracker events" on public.tracker_events;
create policy "public can insert tracker events"
on public.tracker_events
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
    and c.is_paid = true
    and c.status in ('draft', 'active')
    and (c.expires_at is null or c.expires_at > now())
  )
);

drop policy if exists "tracker events stay server mediated" on public.tracker_events;
create policy "tracker events stay server mediated"
on public.tracker_events
for select
using (false);

drop policy if exists "uploads stay server mediated" on public.uploads;
create policy "uploads stay server mediated"
on public.uploads
for all
using (false)
with check (false);

drop policy if exists "payments stay server only" on public.payments;
create policy "payments stay server only"
on public.payments
for all
using (false)
with check (false);
