-- Creator accounts for recovering paid cards, creator links, and chat rooms.
-- This is intentionally separate from auth.users so the MVP can support
-- email-or-phone + password without requiring Supabase Auth onboarding.

create table if not exists public.creator_accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  display_name text,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

alter table public.creator_accounts enable row level security;

drop policy if exists "creator accounts stay server only" on public.creator_accounts;
create policy "creator accounts stay server only"
on public.creator_accounts
for all
using (false)
with check (false);

alter table public.cards
add column if not exists account_id uuid references public.creator_accounts(id) on delete set null;

create index if not exists creator_accounts_email_idx on public.creator_accounts(lower(email));
create index if not exists creator_accounts_phone_idx on public.creator_accounts(phone);
create index if not exists cards_account_created_idx on public.cards(account_id, created_at desc);

drop trigger if exists set_creator_accounts_updated_at on public.creator_accounts;
create trigger set_creator_accounts_updated_at
before update on public.creator_accounts
for each row
execute function public.set_updated_at();
