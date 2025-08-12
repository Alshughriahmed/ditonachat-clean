import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripeClient';
import { STRIPE_MODE } from '@/lib/stripeConfig';

export async function GET() {
  const stripe = getStripe();
  const prices = await stripe.prices.list({ limit: 20, expand: ['data.product'] });
  const data = prices.data.map(p => ({
    id: p.id,
    nickname: p.nickname ?? null,
    currency: p.currency,
    amount: p.unit_amount ?? null,
    recurring: p.recurring ? p.recurring.interval : null,
    product: typeof p.product === 'object' ? (p.product.name ?? null) : null,
  }));
  return NextResponse.json({ ok: true, mode: STRIPE_MODE, count: data.length, data });
}
