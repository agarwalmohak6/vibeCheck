# VibeCheck Content Guide

Updated: 2026-10-12

VibeCheck turns a personal message into a private card: an envelope, a letter, a photo gallery, a hidden note, and a reply. All five occasions are available in the builder. Each starts with complete, ready-to-send copy and offers three writing styles.

## Voice

Write as one person speaking to another. Warm, contemporary, direct, lightly playful where appropriate. Use concrete everyday details without inventing a shared history, a booked date, or a specific mistake. Keep slang light enough for the message to age well. Emoji should support the emotion, not replace the sentence.

Default copy must make sense without editing. Encourage a personal detail, but never leave a placeholder in a message a sender could accidentally send. Keep apologies accountable and answers voluntary. No guilt, countdowns, or promises of instant forgiveness.

## Story outlines

### Proposal — The next chapter

Theme: warm ivory stationery, rose ink, champagne detail, intertwined rings. Marriage is explicit; this is distinct from the confession mood.

1. **Opening:** One question. All my heart.
2. **Letter:** Ordinary moments lead to the future the sender wants to build. Close with “Will you marry me?”
3. **Photos:** A little of us — moments worth carrying forward.
4. **Hidden note:** Forever means choosing to build a life together, again and again.
5. **Answer:** Make room to take it in, talk, or answer. A positive answer opens the next-chapter ending.

Styles: everyday forever; a little cinematic; simple and certain. Emoji: 🤍 ✨ 💍.

### Apology — A real apology

Theme: soft pink, quiet spacing, handwritten warmth.

1. **Opening:** I owe you more care.
2. **Letter:** Own the hurt without an excuse. Offer to listen. Respect space. Make clear that actions must follow.
3. **Photos:** These moments matter; they do not erase what needs to change.
4. **Hidden note:** There is no deadline on being okay.
5. **Answer:** Ask what would help and respect the recipient’s pace. Agreement means openness to talking, never automatic forgiveness.

Styles: honest and accountable; soft and sincere; short and direct. Emoji: 🌿 🤍 🕊️.

### Birthday — Your birthday era

Theme: cream, gold, cake, and a little sparkle.

1. **Opening:** Today, you get the spotlight.
2. **Letter:** Celebrate their existence and wish them a good year without age, gender, or achievement assumptions.
3. **Photos:** The good bits — moments to keep and reasons to look forward.
4. **Hidden note:** More days that feel like you, good people, and tiny reasons to smile.
5. **Answer:** Let them choose their birthday energy and collect the love.

Styles: all the love; gentle roast with a sincere finish; a softer, brighter year. Emoji: 🎂 🥳 ✨.

### Confession — A little more than a crush

Theme: First Blush, pink and lavender. The legacy identifier `bestie_check` is retained for saved links; the current product is a romantic confession.

1. **Opening:** Okay. Here is the honest version.
2. **Letter:** Move from deleted messages and hints to a clear “I like you.” Invite possibility without expecting matching feelings.
3. **Photos:** Little moments can take up a surprising amount of room in a heart.
4. **Hidden note:** This is an invitation, not an expectation.
5. **Answer:** Would you like to see where this goes? Leave room for time and an honest answer.

Styles: soft and brave; a little playful; just the truth. Emoji: 💗 🙈 ✨.

### Movie night — Just us & a movie

Theme: Midnight Romance, after-dark colour and a cosy film-night mood.

1. **Opening:** A small plan. Very good company.
2. **Letter:** Invite an easy evening together. Leave the film and timing open unless the sender adds details.
3. **Photos:** Good company makes a simple plan special.
4. **Hidden note:** The company matters more than remembering the plot.
5. **Answer:** Choose film and snack preferences, then make a plan or suggest another time.

Styles: cosy and casual; trailer voice; quiet and sweet. Emoji: 🍿 🎬 🌙.

## Sources and behaviour

- `lib/moodStories.ts`: all mood metadata, 15 letter presets, questions, opening copy, hidden notes, endings, and emoji sets.
- `lib/themes.ts`: palettes and the builder’s template list.
- `components/EnvelopeReveal.tsx`, `LiveSimulator.tsx`, and `RecipientView.tsx`: consume shared mood copy. Saved custom letters are preserved.
- `components/MoodTypewriter.tsx`: grapheme-safe typing, punctuation pauses, progressive mood emoji, instant reading, and reduced-motion support.
- `lib/revealEffects.ts`: scratch coverage and typing helpers. The reveal unlocks at 35% actual cleared area, with an accessible non-gesture alternative.
- `components/MusicSelector.tsx` and `VinylDisk.tsx`: separate selection and playback controls, compact saved state, and a mobile-safe player.

Keep builder previews and delivered cards consistent. Do not add an independent table of English or Hinglish defaults in a component. Other localized copy must be explicitly selected, not silently substituted for the sender’s words.
