/** Public build-time switch; enabling checkout also requires the server switch. */
export function isCashfreeCheckoutVisible(): boolean {
  return process.env.NEXT_PUBLIC_CASHFREE_CHECKOUT_ENABLED === 'true';
}
