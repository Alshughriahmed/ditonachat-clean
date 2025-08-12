import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.METERED_BASE;
  const apiKey = process.env.METERED_TURN_API_KEY || process.env.METERED_API_KEY;
  if (!base || !apiKey) return NextResponse.json({ iceServers: [], error: 'Missing METERED_TURN_API_KEY' });
  try {
    const url = `${base}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Metered ${r.status}`);
    const j = await r.json();
    const ice = Array.isArray(j) ? j : (j.iceServers || []);
    return NextResponse.json({ iceServers: ice });
  } catch (e:any) {
    return NextResponse.json({ iceServers: [], error: e.message });
  }
}
