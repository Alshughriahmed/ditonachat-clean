import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = process.env;
  const status = {
    prisma: !!env.DATABASE_URL ? 'configured' : 'missing',
    nextauth: !!env.NEXTAUTH_URL && !!env.NEXTAUTH_SECRET ? 'configured' : 'missing',
    stripe: !!env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
    redis: !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'missing',
    socketUrl: env.NEXT_PUBLIC_SOCKET_URL || 'not-set',
    ts: Date.now(),
  };
  return NextResponse.json(status);
}
