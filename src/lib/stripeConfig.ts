export type StripeMode = 'live' | 'test';

const envMode = (process.env.STRIPE_MODE as StripeMode) || (process.env.NODE_ENV === 'production' ? 'live' : 'test');
export const STRIPE_MODE: StripeMode = envMode;

export const STRIPE_SECRET_KEY =
  envMode === 'live'
    ? process.env.STRIPE_SECRET_KEY
    : (process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY);

export const STRIPE_PUBLISHABLE_KEY =
  envMode === 'live'
    ? (process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : (process.env.STRIPE_TEST_PUBLISHABLE_KEY
        || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export const PRICE_PRO_WEEKLY =
  envMode === 'live' ? process.env.STRIPE_PRO_WEEKLY_ID : (process.env.STRIPE_TEST_PRO_WEEKLY_ID || process.env.STRIPE_PRO_WEEKLY_ID);
export const PRICE_VIP_MONTHLY =
  envMode === 'live' ? process.env.STRIPE_VIP_MONTHLY_ID : (process.env.STRIPE_TEST_VIP_MONTHLY_ID || process.env.STRIPE_VIP_MONTHLY_ID);
export const PRICE_ELITE_YEARLY =
  envMode === 'live' ? process.env.STRIPE_ELITE_YEARLY_ID : (process.env.STRIPE_TEST_ELITE_YEARLY_ID || process.env.STRIPE_ELITE_YEARLY_ID);
export const PRICE_BOOST_DAILY =
  envMode === 'live' ? process.env.STRIPE_BOOST_ME_DAILY_ID : (process.env.STRIPE_TEST_BOOST_ME_DAILY_ID || process.env.STRIPE_BOOST_ME_DAILY_ID);

export function assertStripeEnv() {
  const missing: string[] = [];
  if (!STRIPE_SECRET_KEY) missing.push(`STRIPE_${envMode.toUpperCase()}_SECRET_KEY`);
  if (!STRIPE_PUBLISHABLE_KEY) missing.push(`STRIPE_${envMode.toUpperCase()}_PUBLISHABLE_KEY`);
  if (!PRICE_PRO_WEEKLY) missing.push(`PRICE_PRO_WEEKLY (${envMode})`);
  if (!PRICE_VIP_MONTHLY) missing.push(`PRICE_VIP_MONTHLY (${envMode})`);
  if (!PRICE_ELITE_YEARLY) missing.push(`PRICE_ELITE_YEARLY (${envMode})`);
  if (!PRICE_BOOST_DAILY) missing.push(`PRICE_BOOST_DAILY (${envMode})`);
  if (missing.length) console.warn('[stripeConfig] Missing env:', missing.join(', '));
  return missing;
}
