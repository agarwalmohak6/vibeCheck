/**
 * UPI intent link builder and device check.
 */

export function buildUpiIntent(
  vpa: string,
  payeeName: string,
  transactionId: string,
  amount: number,
  note: string = "VibeCheck Premium Unlock"
): string {
  // Clean payee name and note for URI encoding
  const pa = encodeURIComponent(vpa);
  const pn = encodeURIComponent(payeeName);
  const tr = encodeURIComponent(transactionId);
  const tn = encodeURIComponent(note);
  const am = amount.toFixed(2);

  // UPI deep link specification
  // upi://pay?pa=recipient@vpa&pn=PayeeName&tr=TransactionID&tn=Note&am=Amount&cu=INR
  return `upi://pay?pa=${pa}&pn=${pn}&tr=${tr}&tn=${tn}&am=${am}&cu=INR`;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const hasTouch = window.navigator.maxTouchPoints > 0;
  
  const isMobileUA = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone|palm/i.test(ua);
  
  return isMobileUA || hasTouch;
}
