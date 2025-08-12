'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from '@/lib/runtime';

export default function DebugPage() {
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const sock = useRef<Socket | null>(null);
  const log = (m: string) => setLines((p) => [...p, `${new Date().toISOString()} ${m}`]);

  useEffect(() => { setMounted(true); setUserId(`u_${Math.random().toString(36).slice(2,10)}`); }, []);

  useEffect(() => {
    if (!mounted || !userId) return;
    const base = getBaseUrl();
    log(`Init socket same-origin (polling) as ${userId}`);
    const s = io(base, { path: '/api/socket', transports: ['polling'], upgrade: false, withCredentials: true, query: { userId }, forceNew: true });
    sock.current = s;

    s.on('connect', () => { setConnected(true); log('connect'); });
    s.on('connect_error', (e) => log(`connect_error: ${e.message}`));
    s.on('matching:matchFound', (rid: string) => { setRoomId(rid); log(`matchFound ${rid}`); });
    s.on('matching:noMatch', () => log('noMatch'));
    s.on('disconnect', () => { setConnected(false); log('disconnect'); });

    return () => { s.disconnect(); log('disconnect'); };
  }, [mounted, userId]);

  const enqueue = () => { sock.current?.emit('matching:enqueue'); log('emit enqueue'); };
  const leave   = () => { sock.current?.emit('matching:leave');   log('emit leave'); };

  if (!mounted) return <div style={{padding:16}}>Booting…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Debug / Socket</h1>
      <div>Connected: {String(connected)} | UserId: <span suppressHydrationWarning>{userId}</span></div>
      <div>roomId: {roomId ?? '-'}</div>
      <button onClick={enqueue}>Enqueue</button>
      <button onClick={leave} style={{ marginLeft: 8 }}>Leave</button>
      <pre style={{ marginTop: 12, height: 320, overflow: 'auto', background: '#111', color: '#0f0', padding: 8 }}>
        {lines.join('\n')}
      </pre>
    </div>
  );
}
