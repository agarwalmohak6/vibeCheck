# VibeCheck

VibeCheck is a Next.js application for creating private interactive digital
greeting cards. A creator can personalise a theme, message, music, questions
and passcode, pay for the selected access period, and share one private link
with the intended recipient.

Live website: [vibecheck-gh7u.onrender.com](https://vibecheck-gh7u.onrender.com)

## Product

- Private sorry, birthday and bestie card templates
- Interactive envelope, music, questions and replies
- One-person shareable links with creator tracking
- Transparent one-time pricing: ₹49, ₹79 and ₹119
- Razorpay checkout with a manually verified UPI fallback
- Digital-only delivery; no physical goods or shipping

## Customer Information

- [About Us](https://vibecheck-gh7u.onrender.com/about)
- [Pricing](https://vibecheck-gh7u.onrender.com/pricing)
- [Contact Us](https://vibecheck-gh7u.onrender.com/contact)
- [Terms & Conditions](https://vibecheck-gh7u.onrender.com/terms)
- [Privacy Policy](https://vibecheck-gh7u.onrender.com/privacy)
- [Cancellation & Refund Policy](https://vibecheck-gh7u.onrender.com/refund-policy)
- [Digital Delivery Policy](https://vibecheck-gh7u.onrender.com/shipping-policy)

## Local Development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and replace every placeholder with the
appropriate development value. Never commit `.env.local`, Razorpay secrets,
Supabase service-role keys, or application token secrets.

## Validation

```bash
npm run lint
npm run build
```

Production payment verification is fail-closed: mock signatures are accepted
only outside production, and a Razorpay payment must match the card, order,
captured status, INR currency and selected tier amount before the card unlocks.

## Availability monitoring

The `Render uptime check` GitHub Actions workflow requests `/api/health` every
five minutes and can also be run manually. It provides a lightweight availability
check and keeps the free Render web service from reaching its 15-minute idle
window during normal GitHub Actions operation.
