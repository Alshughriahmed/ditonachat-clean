import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripeClient';
import { STRIPE_MODE } from '@/lib/stripeConfig';

export async function POST(req: Request) {
  try {
    const { priceId, successUrl, cancelUrl, mode } = await req.json();
    if (!priceId) return NextResponse.json({ ok:false, error:'priceId required' }, { status: 400 });

    const stripe = getStripe();
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: mode === 'payment' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${base}/checkout/cancel`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok:true, mode: STRIPE_MODE, id: session.id, url: session.url });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'unknown_error' }, { status: 500 });
  }
}
