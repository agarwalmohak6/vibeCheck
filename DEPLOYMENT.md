# VibeCheck Deployment Guide

This repo is a Next.js full-stack app. The frontend pages live in `app/*` and the backend API routes live in `app/api/*`.

For a Vercel frontend plus Render backend setup, deploy the same repo twice:

- Vercel serves the public website and pages.
- Render serves the same Next.js app, but Vercel proxies `/api/*` requests to Render through `BACKEND_ORIGIN`.

If you want the simplest launch, you can also deploy only on Vercel and leave `BACKEND_ORIGIN` blank.

## 1. Prepare Supabase

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run the migration in `supabase/migrations/202606150001_vibecheck_core.sql`.
4. Create a Storage bucket named `card-uploads`.
5. Copy these values:
   - Project URL
   - Anon public key
   - Service role key

## 2. Environment Variables

Use these on both Vercel and Render unless noted.

| Variable | Required | Where | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Yes | Vercel + Render | `https://your-vercel-domain.vercel.app` |
| `BACKEND_ORIGIN` | Only for Vercel proxy | Vercel only | `https://your-render-service.onrender.com` |
| `VIBECHECK_TOKEN_SECRET` | Yes | Vercel + Render | Long random secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel + Render | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel + Render | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel + Render | Supabase service role key |
| `SUPABASE_UPLOAD_BUCKET` | Yes | Vercel + Render | `card-uploads` |
| `RAZORPAY_KEY_ID` | Payments | Vercel + Render | Razorpay key id |
| `RAZORPAY_KEY_SECRET` | Payments | Vercel + Render | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Payments | Render, or Vercel if not using Render proxy | Razorpay webhook secret |
| `GIPHY_API_KEY` | GIF search | Render, or Vercel if not using Render proxy | GIPHY API key |
| `POSTHOG_API_KEY` | Optional analytics | Vercel + Render | PostHog project key |
| `POSTHOG_HOST` | Optional analytics | Vercel + Render | `https://app.posthog.com` |
| `NEXT_PUBLIC_UPI_VPA` | Optional fallback | Vercel | `vibecheck@upi` |
| `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS` | Local/demo only | Local | `false` in production |

Music search uses public iTunes previews and does not need an API key.

## 3. Deploy Backend on Render

1. Go to Render.
2. Create a new **Web Service**.
3. Connect the GitHub repo.
4. Select branch `main`.
5. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Node version: `20` or newer
6. Add the environment variables from the table.
7. Leave `BACKEND_ORIGIN` blank on Render.
8. Deploy.
9. Copy the Render service URL, for example:
   - `https://vibecheck-api.onrender.com`

## 4. Deploy Frontend on Vercel

1. Go to Vercel.
2. Import the GitHub repo.
3. Select branch `main`.
4. Vercel should detect Next.js automatically.
5. Use these settings:
   - Install Command: `npm ci`
   - Build Command: `npm run build`
   - Output Directory: leave default
6. Add the environment variables from the table.
7. Set `BACKEND_ORIGIN` to the Render URL.
8. Set `NEXT_PUBLIC_BASE_URL` to the Vercel production URL.
9. Deploy.

After this, frontend requests to `/api/*` on Vercel will be forwarded to Render.

## 5. Razorpay Webhook

In Razorpay dashboard:

1. Create a webhook URL:
   - If using Render backend: `https://your-render-service.onrender.com/api/payment/webhook`
   - If using Vercel only: `https://your-vercel-domain.vercel.app/api/payment/webhook`
2. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.
3. Enable payment events needed for successful payments.
4. Redeploy after changing env vars.

## 6. Production Checklist

1. Supabase migration is applied.
2. `card-uploads` bucket exists.
3. `NEXT_PUBLIC_BASE_URL` is the final Vercel URL.
4. `BACKEND_ORIGIN` on Vercel points to Render.
5. Render has all private server keys.
6. Vercel has public keys and any keys needed at build time.
7. Razorpay webhook points to the backend currently handling `/api/payment/webhook`.
8. GIPHY search works after `GIPHY_API_KEY` is set.
9. Create a test card and open the recipient card link.
10. Send a chat message from creator and recipient views.

## 7. If Something Breaks

| Issue | Fix |
| --- | --- |
| API calls fail on Vercel | Check `BACKEND_ORIGIN` and redeploy Vercel. |
| Cards do not persist | Check Supabase URL, anon key, service role key, and migration. |
| Uploads fail | Confirm `SUPABASE_UPLOAD_BUCKET=card-uploads` and bucket exists. |
| Payment webhook fails | Check `RAZORPAY_WEBHOOK_SECRET` and webhook URL. |
| GIFs show fallback only | Add `GIPHY_API_KEY` on the API host. |
| Render sleeps on free plan | First request can be slow. Upgrade Render plan for production. |

## 8. Recommended Launch Order

1. Push `main`.
2. Deploy Render backend from `main`.
3. Copy Render URL.
4. Add `BACKEND_ORIGIN` on Vercel.
5. Deploy Vercel frontend from `main`.
6. Add final domain to Vercel.
7. Update `NEXT_PUBLIC_BASE_URL` to final domain on both Vercel and Render.
8. Redeploy both services.
