# VibeCheck deployment

VibeCheck is a single Next.js service deployed on Render. Supabase stores cards and payment records, Razorpay processes payments, and Gmail SMTP delivers receipts/recovery links.

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
GMAIL_USER=your-address@gmail.com
GMAIL_APP_PASSWORD=your-16-character-google-app-password
EMAIL_FROM_NAME=VibeCheck
EMAIL_REPLY_TO=your-address@gmail.com
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

### Enable UPI, QR and UPI apps

The app highlights UPI first and keeps Cards, NetBanking and Wallets available. Razorpay Checkout is configured with a five-minute timeout.

Razorpay still controls which methods are available to the account:

1. Switch the Razorpay Dashboard to **Live Mode** after account activation.
2. Open **Account & Settings → Payment Methods** and request/enable **UPI** if it is not active.
3. Open **Account & Settings → Payment Configuration** under Checkout settings.
4. Create or edit the checkout configuration and show **UPI QR Code** and **UPI Apps**.
5. Keep Google Pay, Paytm, PhonePe and BHIM enabled where Razorpay lists them, then **Save as Default**.
6. Repeat the configuration in Test Mode when testing with `rzp_test_...` keys.

On desktop web, Razorpay normally presents a UPI QR. On supported mobile browsers it presents installed UPI apps. Google Pay and Paytm are provided by Razorpay automatically when UPI is enabled and the device/account is eligible.

Manual UPI ID/number entry (UPI Collect) is deprecated for most web merchants from 28 February 2026. It cannot safely be forced from this app; Razorpay will show it only for eligible exempt accounts. Use UPI QR or UPI Intent instead.

The five-minute setting closes the Standard Checkout session. Razorpay notes that browser timer throttling can occasionally delay a client-side timeout. Payment validity remains protected by server-side order amount, signature and captured-payment verification.

## Gmail email delivery

1. Turn on 2-Step Verification for `GMAIL_USER`.
2. Open `https://myaccount.google.com/apppasswords`.
3. Create an App Password named `VibeCheck Render`.
4. Add the generated 16-character value to Render as `GMAIL_APP_PASSWORD`.
5. Never use or paste your normal Google password.

A successful verified payment triggers a branded confirmation email containing payment details and the private receipt/recovery URL. Gmail is suitable for an early, low-volume launch; move to a transactional provider with a verified domain when volume grows.

## Render

- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health endpoint: `/api/health`

The included GitHub Action requests the health endpoint periodically to reduce free-instance sleep. Free hosting cannot provide a contractual 100% uptime guarantee; occasional cold starts, maintenance, or provider limits remain possible.
