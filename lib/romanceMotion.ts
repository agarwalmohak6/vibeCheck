export const ENVELOPE_OPEN_MS = 4250;
export const LETTER_OPEN_MS = 1200;
export const PHOTO_HOLD_MS = 6500;

/** The whole moving button stays inside its own lane and clear of the Yes button. */
export function dodgePosition(width: number, height: number, buttonWidth: number, buttonHeight: number, attempt: number) {
  const paths = [[.08, .18], [.9, .85], [.15, .84], [.85, .1], [.48, .9], [.03, .55], [.95, .55], [.5, .08]];
  const [x, y] = paths[(Math.max(1, attempt) - 1) % paths.length];
  const padding = 8;
  return {
    x: padding + Math.max(0, width - buttonWidth - padding * 2) * x,
    y: padding + Math.max(0, height - buttonHeight - padding * 2) * y,
  };
}
