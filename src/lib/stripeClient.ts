import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '@/lib/stripeConfig';
let _stripe: Stripe | null = null;
export function getStripe() {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY for current mode');
    _stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}
