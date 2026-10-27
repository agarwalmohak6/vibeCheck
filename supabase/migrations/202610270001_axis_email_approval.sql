-- Only the backend service role may turn validated bank-email evidence into approval.
alter table public.payments add column if not exists amount_in_paise integer;
alter table public.payments add column if not exists currency text not null default 'INR';
create unique index if not exists payments_axis_message_once
  on public.payments ((raw_payload->'axis_email_proof'->>'messageId'))
  where raw_payload->'axis_email_proof'->>'messageId' is not null;

create or replace function public.approve_axis_email_payment(
  p_card_id uuid, p_transaction_id text, p_amount_in_paise integer,
  p_message_id text, p_account_last4 text, p_received_at timestamptz, p_transaction_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  proof public.payments%rowtype;
  card public.cards%rowtype;
  verified_id text := 'upi_manual_' || p_transaction_id;
begin
  if p_transaction_id is null or p_account_last4 is null or p_message_id is null or p_amount_in_paise is null
     or p_transaction_id !~ '^[0-9]{12}$' or p_account_last4 !~ '^[0-9]{4}$'
     or p_message_id !~ '^[A-Za-z0-9_-]{8,200}$' or p_amount_in_paise <= 0 then
    raise exception 'INVALID_BANK_EVIDENCE';
  end if;
  select * into proof from public.payments
    where provider = 'upi_manual' and provider_payment_id = p_transaction_id for update;
  if not found or proof.card_id <> p_card_id
     or coalesce(proof.amount_in_paise, (proof.raw_payload->>'expected_amount_in_paise')::integer) is distinct from p_amount_in_paise
     or proof.currency <> 'INR' or proof.status not in ('created','paid') then
    raise exception 'PAYMENT_EVIDENCE_MISMATCH';
  end if;
  select * into card from public.cards where id = p_card_id for update;
  if not found then raise exception 'CARD_NOT_FOUND'; end if;
  if card.status = 'disabled' or (card.expires_at is not null and card.expires_at < now()) then
    raise exception 'CARD_NOT_ELIGIBLE';
  end if;
  if card.is_paid then
    if card.payment_id = verified_id then return jsonb_build_object('newly_verified', false); end if;
    raise exception 'CARD_ALREADY_PAID';
  end if;
  if p_received_at is null or p_transaction_at is null
     or p_received_at < greatest(card.created_at - interval '5 minutes', now() - interval '24 hours')
     or p_transaction_at < greatest(card.created_at - interval '5 minutes', now() - interval '24 hours')
     or p_received_at > now() + interval '5 minutes' or p_transaction_at > p_received_at + interval '5 minutes'
     or p_transaction_at > now() + interval '5 minutes' then
    raise exception 'BANK_EVIDENCE_TOO_OLD';
  end if;
  if exists (select 1 from public.payments where id <> proof.id
    and raw_payload->'axis_email_proof'->>'messageId' = p_message_id) then
    raise exception 'BANK_CREDIT_ALREADY_USED';
  end if;
  update public.payments set status = 'paid', verified_at = now(), amount_in_paise = p_amount_in_paise,
    raw_payload = raw_payload || jsonb_build_object('axis_email_proof', jsonb_build_object(
      'messageId', p_message_id, 'accountLast4', p_account_last4, 'receivedAt', p_received_at,
      'transactionAt', p_transaction_at, 'amountInPaise', p_amount_in_paise, 'transactionId', p_transaction_id))
    where id = proof.id;
  update public.cards set is_paid = true, payment_status = 'paid', payment_id = verified_id where id = p_card_id;
  return jsonb_build_object('newly_verified', true);
end;
$$;

revoke all on function public.approve_axis_email_payment(uuid,text,integer,text,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.approve_axis_email_payment(uuid,text,integer,text,text,timestamptz,timestamptz) to service_role;
