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
- Cashfree automated checkout with a direct UPI fallback
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
appropriate development value. Never commit `.env.local`, Cashfree secrets,
Supabase service-role keys, or application token secrets.

## Validation

```bash
npm test
npm run lint
npm run build
```

For free production email on Render, configure `BREVO_API_KEY` and a verified
`BREVO_SENDER_EMAIL`. See the email setup section in [DEPLOYMENT.md](DEPLOYMENT.md).

Production payment verification is fail-closed: mock signatures are accepted
only outside production, and a Cashfree payment must match the card, order,
paid status, INR currency and selected tier amount before the card unlocks.

## Availability monitoring

The `Render uptime check` GitHub Actions workflow requests `/api/health` on a
five-minute schedule and can also be run manually. It validates fresh application
JSON and retries cold starts; an HTTP 200 Render loading page is not success.
The check has no database dependency and does not run a background loop inside
the sleeping service. Test it with `node --test tests/health-monitor.test.mjs`.

This is best-effort, not an always-on guarantee. GitHub can delay or drop scheduled
runs and disables public-repository schedules after 60 days without repository
activity. Re-enable it from Actions if its state is `disabled_inactivity`.
For an independent monitor, configure an external HTTPS GET every five minutes
to `https://vibecheck-gh7u.onrender.com/api/health`, with a JSON check for
`status: ok` and `service: vibecheck`. No token is needed.

Render Free sleeps after 15 minutes without inbound traffic, can restart at any
time, and shares 750 running-instance hours per workspace per month. Keeping one
instance awake uses up to 744 hours in a 31-day month. Multiple free services share
that allowance. Pings cannot prevent quota suspension or infrastructure restarts.
See [Render Free limits](https://render.com/docs/free) and
[GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
