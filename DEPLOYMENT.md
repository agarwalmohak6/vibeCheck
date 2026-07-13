# VibeCheck Deployment + Payment Guide

This app is a Next.js full-stack app.

- Frontend pages live in `app/*`.
- API routes live in `app/api/*`.
- Supabase stores cards, messages, payments, and uploads.
- Vercel should serve the public frontend.
- Render should serve the backend API.

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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel + Render | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel + Render | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel + Render | Supabase service role key |
| `SUPABASE_UPLOAD_BUCKET` | Yes | Vercel + Render | `card-uploads` |
| `GIPHY_API_KEY` | Yes for GIF search | Render | GIPHY API key |
| `NEXT_PUBLIC_UPI_VPA` | Yes for direct UPI | Vercel + Render | `yourbrand@upi` |
| `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS` | No in production | Vercel + Render | `false` |
| `POSTHOG_API_KEY` | Optional | Vercel + Render | PostHog key |
| `POSTHOG_HOST` | Optional | Vercel + Render | `https://app.posthog.com` |

Only keep Razorpay variables if you decide to use Razorpay later:

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
   - Node version: `20` or newer
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

You asked for UPI payments that are free and do not cost convenience fees.

The cleanest low-cost launch path is **direct UPI QR / UPI intent**:

1. User creates a card.
2. App shows a UPI QR or opens the user's UPI app.
3. User pays directly to your UPI VPA.
4. User enters the UPI reference number / UTR after payment.
5. You verify the payment in your bank or UPI app.
6. You mark the card as paid.

This avoids payment gateway platform fees, but it is not fully automatic unless you get a bank/PSP integration.

## 7. Direct UPI: What To Use

Use this for launch:

| Need | Use |
| --- | --- |
| No gateway convenience fee | Direct UPI VPA |
| Easy customer payment | UPI QR + mobile UPI intent |
| Payment proof | UTR/reference number |
| Verification | Manual admin check first |
| Later automation | Bank statement API, PSP API, or gateway |

Current app support:

- `lib/upi.ts` already builds a `upi://pay` intent.
- `components/QRCheckout.tsx` already renders a UPI QR.
- `NEXT_PUBLIC_UPI_VPA` controls the payment VPA.
- The current webhook path can mark a card paid, but production direct-UPI verification still needs an admin or bank integration.

## 8. Direct UPI Production Flow

For the first live version, keep it simple:

1. Set `NEXT_PUBLIC_UPI_VPA` to your real merchant VPA.
2. Keep `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=false`.
3. Show the QR / UPI intent on checkout.
4. Ask the user for:
   - UPI app used
   - UTR / reference number
   - Optional screenshot
5. Add a small admin-only way to verify and mark `is_paid=true`.
6. Release the card only after verification.

This is not instant, but it preserves the no-convenience-fee requirement.

## 9. If You Need Instant Auto-Verification

Use a payment gateway or official bank/PSP integration.

Tradeoff:

| Option | Cost | Verification | Best for |
| --- | --- | --- | --- |
| Direct UPI VPA | Usually no gateway fee | Manual | Early launch, low volume |
| Bank/PSP API | Depends on bank | Automatic | Serious production setup |
| Razorpay/Cashfree/PhonePe gateway | Gateway/platform fees may apply | Automatic webhook | Fastest polished launch |

Razorpay is convenient because webhooks are easy, but it is not the no-fee option. Their pricing page currently advertises payment gateway/platform fees, so use it only if instant verification matters more than zero fees.

## 10. Production Checklist

1. `main` is pushed.
2. `npm run build` passes locally.
3. Supabase migration is applied.
4. `card-uploads` bucket exists.
5. Render backend is deployed.
6. Vercel frontend is deployed.
7. `BACKEND_ORIGIN` on Vercel points to Render.
8. `NEXT_PUBLIC_BASE_URL` uses the final Vercel/domain URL.
9. `NEXT_PUBLIC_UPI_VPA` uses your real UPI VPA.
10. Mock payments are off in production.
11. GIF search works with `GIPHY_API_KEY`.
12. Create a test card.
13. Pay using UPI.
14. Verify and mark paid.
15. Open the recipient card link.
16. Test creator and recipient chat.

## 11. SEO + Google Search Console Go-Live

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
