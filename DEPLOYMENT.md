# VibeCheck deployment

VibeCheck is a single Next.js service deployed on Render. Supabase stores cards and payment records, Razorpay processes payments, and Resend delivers receipts/recovery links.

## Required Render environment variables

```env
NEXT_PUBLIC_BASE_URL=https://vibecheck-gh7u.onrender.com
VIBECHECK_TOKEN_SECRET=long-random-secret
NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_UPLOAD_BUCKET=card-uploads
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=re_...
EMAIL_FROM=VibeCheck <receipts@your-verified-domain.com>
EMAIL_REPLY_TO=support@your-domain.com
GIPHY_API_KEY=...
```

Do not add a merchant contact as checkout prefill. The app sends only the purchaser name and purchaser email to Razorpay Checkout.

## Database

Apply migrations in filename order through the Supabase SQL Editor. The latest migration adds purchaser receipt delivery and one-device recipient claims, and removes retired account/chat tables.

## Razorpay

Configure the webhook URL as:

```txt
https://vibecheck-gh7u.onrender.com/api/payment/webhook
```

Subscribe to `payment.captured` and `order.paid`. Copy the webhook signing secret to `RAZORPAY_WEBHOOK_SECRET`.

## Resend

Verify a domain you own in Resend, then use an address on that domain for `EMAIL_FROM`. A successful verified payment triggers an idempotent confirmation email containing payment details and the private receipt/recovery URL.

## Render

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health endpoint: `/api/health`

The included GitHub Action requests the health endpoint periodically to reduce free-instance sleep. Free hosting cannot provide a contractual 100% uptime guarantee; occasional cold starts, maintenance, or provider limits remain possible.
