export const DEFAULT_UPI_VPA = 'agarwalmohak6-3@okaxis';

export function buildUpiIntent(
  vpa: string,
  payeeName: string,
  transactionId: string,
  amount: number,
  note: string = "VibeCheck Premium Unlock"
): string {
  if (!isValidUpiVpa(vpa)) throw new Error('Invalid receiving UPI ID');
  if (!Number.isFinite(amount) || amount < 0.01) throw new Error('Invalid UPI amount');
  if (!payeeName.trim()) throw new Error('Payee name is required');
  const params = new URLSearchParams({
    pa: vpa.trim(),
    pn: payeeName.trim(),
    tn: note.trim(),
    am: amount.toFixed(2),
    cu: "INR",
  });

  if (transactionId.trim()) {
    params.set("tr", transactionId.trim());
  }

  // UPI deep link specification
  // upi://pay?pa=recipient@vpa&pn=PayeeName&tr=TransactionID&tn=Note&am=Amount&cu=INR
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
}

export function isValidUpiVpa(vpa: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9._-]{2,64}$/.test(vpa.trim());
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
