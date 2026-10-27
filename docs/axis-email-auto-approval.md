# Axis Bank email matching for direct UPI

The customer still pays the receiving UPI ID and enters a **Transaction ID**. The
`transaction_id` API field is preferred; old `utr` clients remain supported. The
bank's 12-digit UPI reference is required for automatic matching. An app-specific
order ID is not interchangeable with that bank reference.

## What is implemented

- Search the owner's mailbox through the read-only Gmail API when a reference is
  submitted, then retry while the existing checkout polls for payment status.
- Read only recent Axis alerts matching that reference. No inbox changes, sends,
  or marking messages read are needed for verification.
- Validate the actual Axis credit-summary format, including `Amount Credited`,
  `Account Number`, `Date & Time`, and `Transaction Info: UPI/P2A/...` or `P2M`.
- Require Gmail's unambiguous `Authentication-Results` with aligned bank DKIM and
  DMARC success, an exact approved sender, matching subject/body amounts, the
  receiving account suffix, a recent transaction time, and the complete reference.
- Check the price saved on the payment submission, not an amount from the browser.
- Atomically approve the payment and card through a service-role-only database
  function. A payment reference and Gmail message can only be consumed once.
- Deliver the existing card-ready notification only after the database commits.
- Keep ambiguous, missing, old, failed, forwarded, debit, or unsupported alerts in
  manual review. The manual admin confirmation requirement remains intact.

## One-time backend connection

Installing Gmail in ChatGPT lets the assistant inspect sample alerts. It does
**not** authorize the independently hosted Render application to access Gmail.
Do not copy or extract ChatGPT connector credentials into the application.

1. Apply `supabase/migrations/202610270001_axis_email_approval.sql` to the
   application's Supabase database. This adds an atomic approval function and a
   uniqueness index; it does not approve existing payments.
2. Create a Google OAuth client for the application's owner, enable the Gmail API,
   and authorize offline access with only
   `https://www.googleapis.com/auth/gmail.readonly`. Use Google's server-side OAuth
   flow to obtain the refresh token; do not put tokens in source control or chat.
3. Set these **server-side** Render variables through the service's Environment
   page, keeping all current variables:

   - `GMAIL_PAYMENTS_CLIENT_ID`
   - `GMAIL_PAYMENTS_CLIENT_SECRET`
   - `GMAIL_PAYMENTS_REFRESH_TOKEN`
   - `GMAIL_PAYMENTS_MAILBOX` — the exact owner mailbox receiving the alerts
   - `AXIS_RECEIVING_ACCOUNT_LAST4` — the four digits shown on the receiving
     account's bank alerts; confirm this is the account behind the checkout UPI ID
4. Validate a small real payment end to end, including the amount and bank
   reference shown in the buyer's app. A debit notification or an alert for a
   different receiving account must not unlock a card.
5. Only after the connection and receiving account are confirmed, set
   `AXIS_EMAIL_AUTO_APPROVAL_ENABLED=true` and deploy.

Automatic approval is disabled unless **all** settings are present. Old payment
submissions without a stored amount remain manual. Alerts older than 24 hours or
before the order (apart from five minutes of clock tolerance) cannot approve it.
There is a per-reference cooldown and duplicate/concurrent-write protection.
Never change the database function to run from an anonymous browser role.

## Checking after the customer closes checkout

The optional `integrations/axis-reconcile-apps-script.gs` uses a Google Apps Script
time trigger to call the private reconciliation endpoint each minute. It reads
no Gmail itself and can only ask the backend to check a bounded page of pending
payments. The backend still requires authenticated bank evidence for every approval.

Set a random `PAYMENT_RECONCILE_SECRET` of at least 32 characters in Render and in
the script's Script Properties. Set the script property `APP_BASE_URL` to your
existing HTTPS app URL. Copy the script into a project you own, then run
`installAxisReconciliationTrigger` once and authorize it. Do not put this secret
in browser code or source control. Pagination prevents one unmatched submission
from blocking all other pending payments. Google quotas and Render cold starts
can delay checks; no paid Render cron service is required by this design.

## Limitations

Email is delayed evidence, not a real-time bank settlement API, and the format can
change. The exact reference must appear in the bank alert. Keep manual review for
exceptions and reconciliation. Knowing a reference alone does not prove who paid;
do not expose other customers' references or treat them as login credentials.

A bank or payment provider's signed payment webhook is more reliable when one is
available, but would require that provider's merchant onboarding. This email path
preserves the existing direct-UPI-plus-Transaction-ID checkout and adds no paid
verification service. Without the optional scheduler, checking stops if the
customer closes checkout and resumes on return. The optional scheduler must be
installed and authorized separately; it is not a ChatGPT reminder.

References:
- https://developers.google.com/workspace/gmail/api/auth/web-server
- https://developers.google.com/workspace/gmail/api/guides/filtering
- https://www.axis.bank.in/fraud-awareness/prevent-frauds/phishing-alert
- https://developers.google.com/apps-script/guides/triggers/installable
- https://developers.google.com/apps-script/guides/services/quotas
