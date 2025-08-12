import { NextResponse } from 'next/server';
import { STRIPE_MODE, STRIPE_PUBLISHABLE_KEY } from '@/lib/stripeConfig';

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    stripe: { mode: STRIPE_MODE, publishableKeyPresent: !!STRIPE_PUBLISHABLE_KEY },
    redisConfigured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) && process.env.DISABLE_REDIS !== '1',
    db: process.env.DATABASE_URL?.startsWith('file:') ? 'sqlite' : (process.env.DATABASE_URL?.includes('postgres') ? 'postgres' : 'unknown'),
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || null,
  });
}
