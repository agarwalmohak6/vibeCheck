-- Purchaser recovery and one-device recipient access.
alter table public.cards
  add column if not exists customer_email text,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists recipient_claim_hash text,
  add column if not exists recipient_claimed_at timestamptz;

alter table public.cards
  drop constraint if exists cards_customer_email_length;

alter table public.cards
  add constraint cards_customer_email_length
  check (customer_email is null or char_length(customer_email) between 3 and 160);

-- Creator accounts, admin chat and public reply rooms are intentionally retired.
alter table public.cards drop column if exists account_id;
drop table if exists public.creator_accounts;
drop table if exists public.messages;

create index if not exists cards_recipient_claim_idx
  on public.cards (id, recipient_claim_hash);

alter table public.tracker_events
  drop constraint if exists tracker_events_event_type_check;

alter table public.tracker_events
  add constraint tracker_events_event_type_check
  check (event_type in (
    'card_viewed',
    'envelope_opened',
    'passcode_failed',
    'passcode_unlocked',
    'story_answered',
    'runaway_dodged',
    'cta_accepted'
  ));
