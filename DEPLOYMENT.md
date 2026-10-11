# VibeCheck Deployment + Payment Guide

This app is a Next.js full-stack app.

- Frontend pages live in `app/*`.
- API routes live in `app/api/*`.
- Supabase stores cards, messages, payments, and uploads.
- Vercel can serve the public frontend.
- Render can serve the full app or the backend API.

Vercel will call Render for `/api/*` through `BACKEND_ORIGIN`.

## 1. Before Deployment

1. Push the latest code to `main`.
2. Create a Supabase project.
3. Open Supabase SQL Editor.
4. Run `supabase/migrations/202606150001_vibecheck_core.sql`.
5. Create a Storage bucket named `card-uploads`.
6. Copy these Supabase values:
   - Project URL
   - Anon public key
   - Service role key
7. Create a long random `VIBECHECK_TOKEN_SECRET`.
8. Decide your UPI VPA, for example `yourbrand@oksbi`, `yourbrand@icici`, or your merchant UPI ID.

## 2. Environment Variables

Use these on both Vercel and Render unless the `Where` column says otherwise.

| Variable | Required | Where | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Yes | Vercel + Render | `https://vibecheck.in` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Recommended for SEO | Vercel + Render | Google Search Console meta verification code |
| `BACKEND_ORIGIN` | Yes for split deploy | Vercel only | `https://vibecheck-api.onrender.com` |
| `VIBECHECK_TOKEN_SECRET` | Yes | Vercel + Render | Long random secret |
| `VIBECHECK_ADMIN_SESSION_SECRET` | Recommended; otherwise uses `VIBECHECK_TOKEN_SECRET` | API host | Separate long random admin session secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel + Render | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel + Render | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel + Render | Supabase service role key |
| `SUPABASE_UPLOAD_BUCKET` | Yes | Vercel + Render | `card-uploads` |
| `GIPHY_API_KEY` | Yes for GIF search | Render | GIPHY API key |
| `NEXT_PUBLIC_UPI_VPA` | Yes for direct UPI checkout | Vercel + Render | `yourbrand@upi` |
| `BREVO_API_KEY` | Yes for Brevo Free email | API host | Brevo API key (not an SMTP key) |
| `BREVO_SENDER_EMAIL` | Yes with Brevo | API host | Sender inbox verified in Brevo |
| `RESEND_API_KEY` | Optional alternative to Brevo | API host | Resend API key |
| `VIBECHECK_EMAIL_FROM` | Required only with Resend | API host | `VibeCheck <admin@your-domain.com>` |
| `VIBECHECK_ADMIN_EMAIL` | Yes for OTP + UPI review alerts | Vercel + Render | `agarwalmohak6@gmail.com` |
| `VIBECHECK_ADMIN_WHATSAPP` | Optional for admin WhatsApp alerts | Vercel + Render | `919565814426` |
| `WHATSAPP_CLOUD_API_TOKEN` | Optional for automatic WhatsApp delivery | Vercel + Render | Meta Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional for automatic WhatsApp delivery | Vercel + Render | Meta phone number ID |
| `WHATSAPP_CLOUD_API_VERSION` | Optional | Vercel + Render | `v24.0` |
| `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS` | No in production | Vercel + Render | `false` |
| `POSTHOG_API_KEY` | Optional | Vercel + Render | PostHog key |
| `POSTHOG_HOST` | Optional | Vercel + Render | `https://app.posthog.com` |

### Email delivery on Render

Render Free blocks outbound SMTP ports 25, 465, and 587. Gmail app passwords
cannot make SMTP work on that plan. Use Brevo's HTTPS API on its **Free** plan:

1. Create a free Brevo account and complete its account/transactional sending
   activation. Stay on the Free plan; no paid subscription is needed within its limit.
2. Under Settings > Senders, Domains, IPs > Senders, add the sender inbox and
   verify it with the code Brevo sends there. For an existing Gmail inbox,
   Brevo currently substitutes a compliant sending domain. Brevo describes that
   substitution as temporary, not a permanent alternative to domain authentication.
3. Create a Brevo **API key** (not an SMTP key). Set `BREVO_API_KEY` and
   `BREVO_SENDER_EMAIL` on the server handling `/api/*`. The sender must exactly
   match the verified inbox. `EMAIL_FROM_NAME=VibeCheck` controls the display name;
   `EMAIL_REPLY_TO` is optional and defaults to the sender inbox.
4. Set `VIBECHECK_ADMIN_EMAIL` to the owner's inbox. Set
   `VIBECHECK_ADMIN_SESSION_SECRET` or `VIBECHECK_TOKEN_SECRET` to a long random
   secret; production admin login has no built-in signing secret.
5. Set `NEXT_PUBLIC_BASE_URL` to the public frontend URL and redeploy after
   changing environment variables. With a split deployment, configure email
   on Render, because Vercel forwards API calls there.
6. Request an OTP and create a test order. Confirm the provider accepted each
   email in Brevo's transactional logs, then check both the inbox and spam folder. API success
   means provider acceptance, not guaranteed inbox delivery.

Brevo's Free plan currently allows **300 emails per day**, shared by OTPs,
order links, payment confirmations, review alerts, and other sending on the account.
Above that limit, transactional emails can be queued for a later day, which is
too late for a 10-minute OTP. Monitor daily usage; this app does not upgrade plans
or purchase credits. Free emails include Brevo branding.

Provider selection is deterministic: Brevo when `BREVO_API_KEY` is set, otherwise
Resend when `RESEND_API_KEY` is set, otherwise explicitly configured Gmail SMTP.
There are no automatic cross-provider retries that might duplicate a private email.
If you already have a verified domain on Resend, set `RESEND_API_KEY` and
`VIBECHECK_EMAIL_FROM` instead. Its `resend.dev` test sender cannot send order
links to arbitrary customers and is rejected in production.

Logs contain delivery reason codes (`missing_provider_config`, `invalid_sender`,
`provider_error`, `timeout`) and provider HTTP status, without exposing OTPs or
private tracking links. A failed OTP send returns 502/503 without replacing the
pending OTP cookie. Order creation still succeeds and reports each channel's
delivery result; the checkout page also exposes the private tracking link.

For local or SMTP-capable hosts, `GMAIL_USER` and `GMAIL_APP_PASSWORD` remain an
explicit alternative when no Resend key is configured. Never put credentials in
source code. Revoke and replace the Gmail app password previously committed to
this repository; removing it from the latest code does not remove Git history.

References: [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan),
[Brevo sender setup](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email),
[Brevo sender replacement](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders),
[Render Free restrictions](https://render.com/docs/free#other-limitations)
and [Resend test sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

Direct UPI is the active checkout path. Razorpay remains available as an optional UPI-first gateway path when you want automatic payment confirmation:

| Variable | Required | Where |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | Razorpay only | Vercel + Render |
| `RAZORPAY_KEY_SECRET` | Razorpay only | Vercel + Render |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay only | Render |

## 3. Deploy Backend on Render

1. Open Render.
2. Click **New**.
3. Choose **Web Service**.
4. Connect the GitHub repo.
5. Select branch `main`.
6. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Node version: `20.19+`, `22.12+`, or `24+` (the tests and build were verified on Node 24)
7. Add all required environment variables.
8. Leave `BACKEND_ORIGIN` blank on Render.
9. Deploy.
10. Copy the Render service URL, for example `https://vibecheck-api.onrender.com`.

Render is the backend host. It should handle:

- `/api/cards`
- `/api/messages`
- `/api/uploads`
- `/api/gifs/search`
- `/api/payment/webhook`

## 4. Deploy Frontend on Vercel

1. Open Vercel.
2. Click **Add New Project**.
3. Import the GitHub repo.
4. Select branch `main`.
5. Vercel should detect Next.js automatically.
6. Use these settings:
   - Install Command: `npm ci`
   - Build Command: `npm run build`
   - Output Directory: leave empty/default
7. Add all required environment variables.
8. Set `BACKEND_ORIGIN` to your Render URL.
9. Set `NEXT_PUBLIC_BASE_URL` to your Vercel production URL.
10. Deploy.

After this, the frontend will be on Vercel and API calls to `/api/*` will be proxied to Render.

## 5. Add Your Domain

1. In Vercel, open the project.
2. Go to **Settings**.
3. Open **Domains**.
4. Add your domain, for example `vibecheck.in`.
5. Update DNS as Vercel asks.
6. After the domain works, update `NEXT_PUBLIC_BASE_URL` on both Vercel and Render to the final domain.
7. Redeploy both services.

## 6. Recommended Payment Setup

Use **Direct UPI as the primary path** for the current mobile-first launch:

1. User creates a card.
2. The app creates a unique order ID and sends the creator tracking link by email/WhatsApp when provider keys are configured.
3. The checkout shows an exact-amount UPI QR and mobile `upi://pay` intent.
4. Creator pays in PhonePe, GPay, Paytm, or any UPI app.
5. Creator submits the UTR/reference number.
6. Admin receives an email alert and verifies the UTR from `/admin`.
7. The card unlocks and the creator gets a verified-payment notification.

Use **Razorpay Checkout** when instant automatic confirmation matters more than the gateway fee. The Razorpay code still creates server-side Orders, verifies checkout signatures, validates amount/currency/payment status, and accepts signed webhooks.

## 7. Direct UPI: What To Use

| Need | Use |
| --- | --- |
| No gateway convenience fee | Direct UPI VPA |
| Easy customer payment | UPI QR + mobile UPI intent |
| Payment proof | UTR/reference number |
| Verification | Manual admin check |
| Automatic verification | Razorpay checkout + signed webhook |

Current app support:

- `lib/upi.ts` already builds a `upi://pay` intent.
- `components/QRCheckout.tsx` renders the active direct UPI checkout.
- `NEXT_PUBLIC_UPI_VPA` controls the payment VPA.
- UPI payments made inside Razorpay are automatically verified; direct VPA payments still require UTR/admin or bank/PSP verification.

## 8. Direct UPI Production Flow

For the first live version, keep it simple:

1. Set `NEXT_PUBLIC_UPI_VPA` to your real merchant VPA.
2. Keep `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=false`.
3. Show the QR / UPI intent on checkout.
4. Ask the user for UTR / reference number.
5. Email `VIBECHECK_ADMIN_EMAIL` when the UTR is submitted.
6. Verify from the OTP-gated `/admin` dashboard and mark `is_paid=true`.
7. Release the card only after verification.

This is not instant, but it preserves the no-convenience-fee requirement.

## 9. Razorpay Webhook Configuration

In the Razorpay Dashboard, create a webhook pointing to:

`https://your-domain.com/api/payment/webhook`

Subscribe to the payment events used by your account, especially `payment.authorized`, `payment.captured`, and `payment.failed`. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET` on the server. Never expose `RAZORPAY_KEY_SECRET` or the webhook secret in a browser variable.

The route rejects unsigned webhooks and validates the payment amount and card/order association before unlocking anything.

## 10. Payment Tradeoffs

Tradeoff:

| Option | Cost | Verification | Best for |
| --- | --- | --- | --- |
| Direct UPI VPA | Usually no gateway fee | Manual | Early launch, low volume |
| Bank/PSP API | Depends on bank | Automatic | Serious production setup |
| Razorpay/Cashfree/PhonePe gateway | Gateway/platform fees may apply | Automatic webhook | Fastest polished launch |

Razorpay is convenient because webhooks are easy, but it is not the no-fee option. Their pricing page currently advertises payment gateway/platform fees, so use it only if instant verification matters more than zero fees.

## 11. Production Checklist

1. `main` is pushed.
2. `npm run build` passes locally.
3. Supabase migration is applied.
4. `card-uploads` bucket exists.
5. Render backend is deployed.
6. Vercel frontend is deployed.
7. `BACKEND_ORIGIN` on Vercel points to Render.
8. `NEXT_PUBLIC_BASE_URL` uses the final Vercel/domain URL.
9. `NEXT_PUBLIC_UPI_VPA` uses your real merchant VPA.
10. `BREVO_API_KEY` and verified `BREVO_SENDER_EMAIL` are configured (or the Resend alternative), and email quota remains available.
11. WhatsApp Cloud API env vars are configured if you expect automatic WhatsApp messages; otherwise the app provides `wa.me` share links.
12. Mock payments are off in production.
13. GIF search works with `GIPHY_API_KEY`.
14. Create a test card.
15. Complete a direct UPI payment, submit UTR, receive admin email, approve it in `/admin`, and confirm unlock.
16. If using Razorpay, configure keys/webhook, test UPI with `success@razorpay`, and confirm automatic unlock.
17. Open the recipient card link.
18. Test creator tracking and recipient reactions.

## 12. SEO + Google Search Console Go-Live

The app already generates:

- `/sitemap.xml`
- `/robots.txt`
- SEO metadata
- JSON-LD structured data
- public pages for `/sorry-card`, `/birthday-card`, and `/bestie-card`

Use this flow after the production domain is live.

### A. Pick the Canonical Domain

Use one final public domain everywhere.

Examples:

- `https://vibecheck.in`
- `https://getvibecheck.in`
- `https://vibecheckcards.in`
- Temporary only: `https://vibecheck-gh7u.onrender.com`

Set this value on both Vercel and Render:

```env
NEXT_PUBLIC_BASE_URL=https://your-final-domain.com
```

Redeploy both services after changing it.

### B. Add Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console).
2. Click **Add property**.
3. Choose **URL prefix** if you only control one app URL.
4. Enter the exact production URL, for example:

```txt
https://your-final-domain.com
```

5. Choose **HTML tag** verification.
6. Google will show a tag like this:

```html
<meta name="google-site-verification" content="PASTE_THIS_VALUE_ONLY" />
```

7. Copy only the `content` value.
8. Add it on both Vercel and Render:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=PASTE_THIS_VALUE_ONLY
```

9. Redeploy.
10. Return to Search Console and click **Verify**.

### C. Submit Sitemap

In Search Console:

1. Open your property.
2. Go to **Sitemaps**.
3. Submit:

```txt
sitemap.xml
```

Your full sitemap URL should be:

```txt
https://your-final-domain.com/sitemap.xml
```

### D. Request Indexing

Use the top URL inspection bar in Search Console and request indexing for:

```txt
https://your-final-domain.com/
https://your-final-domain.com/sorry-card
https://your-final-domain.com/birthday-card
https://your-final-domain.com/bestie-card
```

### E. Ranking Reality

Google can index the pages quickly, but ranking for `vibecheck` depends on authority signals too. To improve the chance:

1. Use a custom domain instead of a Render subdomain.
2. Put `VibeCheck` in your Instagram/Facebook bio with the final URL.
3. Add the final URL to GitHub repo About section.
4. Ask early users/friends to mention and link to the site.
5. Keep the homepage public, fast, and crawlable.
6. Avoid indexing private card URLs, dashboard, admin, API, and customize pages.

## 12. Common Fixes

| Issue | Fix |
| --- | --- |
| Vercel API calls fail | Check `BACKEND_ORIGIN`, then redeploy Vercel. |
| Render API is slow at first | Free Render services can sleep. Use a paid instance for production. |
| Cards do not persist | Check Supabase URL, anon key, service role key, and migration. |
| Uploads fail | Confirm `SUPABASE_UPLOAD_BUCKET=card-uploads` and bucket exists. |
| GIFs show fallback only | Add `GIPHY_API_KEY` on Render. |
| Payment never unlocks | Direct UPI needs manual/admin verification unless a bank/gateway webhook marks the card paid. |
| Vercel still uses old env vars | Redeploy after every env change. |
| Google verification fails | Make sure `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set on the frontend host and redeployed. |
| Sitemap shows the wrong domain | Update `NEXT_PUBLIC_BASE_URL` on both hosts and redeploy. |
| Google indexes private pages | Check `/robots.txt`; private card/admin/dashboard/API routes should be disallowed or noindexed. |

## 13. Suggested Launch Order

1. Deploy Render backend.
2. Copy Render URL.
3. Deploy Vercel frontend with `BACKEND_ORIGIN`.
4. Add final domain on Vercel.
5. Update `NEXT_PUBLIC_BASE_URL` everywhere.
6. Set real `NEXT_PUBLIC_UPI_VPA`.
7. Turn mock payments off.
8. Redeploy Render and Vercel.
9. Run one real UPI payment test.
10. Mark the test card paid and verify the full recipient flow.
11. Add Google Search Console verification.
12. Submit `/sitemap.xml`.
13. Request indexing for the public pages.
