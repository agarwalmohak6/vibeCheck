# VibeCheck Content Guide

Last updated: 2026-07-09

This is the common handoff file for product positioning, card storylines, and copy locations. It is meant for a content writer to understand the product quickly before refreshing the live text in code.

## Product

VibeCheck is a paid, private, interactive greeting-card mini site. A sender picks a moment, adds names, a cover image, music, a message, optional privacy lock, and playful answer buttons, then pays once and shares one link.

The product should feel more premium than a WhatsApp text, more personal than a story post, and easier than hiring someone to design a mini page.

## Business Goal

The fastest earning path is to keep the offer simple:

- Three high-intent cards: Sorry, Happy Birthday, and Bestie.
- One-time payment.
- Low entry price.
- Shareable private link.
- Strong emotional payoff inside the first screen.

## Brand Voice

Use language that feels warm, modern, personal, and easy to send. Avoid generic greeting-card copy. The sender should feel like the card was made for one person, not forwarded to many people.

Good copy traits:

- Short and specific.
- Emotionally clear.
- A little playful, but not unserious.
- Premium without sounding corporate.
- Easy for Indian social contexts, but not overly slang-heavy.

## Primary Cards

### Sorry Card

Purpose: Help someone apologize without sounding lazy or performative.

Theme direction: Soft pink, pearl, teddy, handwritten note, gentle apology.

Default button direction:

- Positive: Forgiven
- Playful no: No way

Current preset angles:

- Sincere: own the mistake and ask for one chance.
- Thoughtful: no excuses, show care, ask to reset.
- Light but real: casual apology that still takes responsibility.

### Happy Birthday

Purpose: Give someone a polished birthday card that feels more special than a story post.

Theme direction: Cream, gold, cake, party hats, teddy, celebration details.

Default button direction:

- Positive: Aww, thanks
- Playful no: Still an idiot

Current preset angles:

- Playful: another year older, still iconic.
- Warm: loved for exactly who they are.
- Soft finish: jokes aside, they are a gift.

### Bestie Card

Purpose: Make friendship affection easy to send without becoming too heavy.

Theme direction: Pink-lavender, drinks, sparkle, casual celebration, shared chaos.

Default button direction:

- Positive: Love you bestie
- Playful no: Eww, cringe

Current preset angles:

- Sincere: thank them for being one of the best people in life.
- Funny: chaos partner and emotional support human.
- Soft: forever-person friendship energy.

## Secondary Cards

These are currently de-emphasized for focus and monetization:

- Love Letter: cinematic confession.
- Movie Night: cozy private invite.

They can come back later once the first three moments convert.

## Theme Directions

Current theme names live in `lib/themes.ts`:

- Soft Sorry: warm pink, pearl, handwritten apology energy.
- Birthday Gold: cream, gold, and celebration polish.
- Bestie Bloom: airy lavender-pink for friendship.
- Midnight Romance: dark cinematic finish for later cards.

## Live Copy Source Map

Use these files when changing app copy:

- `lib/strings.ts`: landing page copy, simulator copy, recipient page shared copy.
- `lib/themes.ts`: card names, card descriptions, button defaults, story presets, runaway button lines, theme labels.
- `app/customize/page.tsx`: builder step headings, field labels, helper text, preview fallback behavior.
- `components/LiveSimulator.tsx`: landing page simulator sample flow and visual demo copy.
- `components/RecipientView.tsx`: recipient-side reveal, unlock, buttons, and reply flow.
- `components/SuccessHub.tsx`: post-payment creator dashboard and sharing copy.

## Content Writer Brief

When refreshing the copy, prioritize these outcomes:

- The sender should immediately understand what they are buying.
- Each card should feel giftable within 10 seconds.
- The first preview screen should feel complete even before customization.
- Sorry should feel gentle and trustworthy.
- Birthday should feel bright and premium.
- Bestie should feel easy, funny, and shareable.
- Avoid too many card types until the core three are clearly strong.

## Future Cleanup

The copy is mostly centralized in `lib/strings.ts` and `lib/themes.ts`, but some builder labels still live in `app/customize/page.tsx`. A later cleanup can move all builder strings into one exported content module so writers only edit one source file.
