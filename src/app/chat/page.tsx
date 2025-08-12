'use client';
import { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMatchingQueue } from '@/hooks/useMatchingQueue';

type Choice = 'male'|'female'|'any';

export default function ChatPage() {
  const search = useSearchParams();
  const router = useRouter();
  const type = (search.get('type') || 'any') as Choice;
  const { status, roomId, enqueue, leave, userId } = useMatchingQueue();

  const payload = useMemo(() => ({ type }), [type]);

  useEffect(() => { if (roomId) router.push(`/chat/${roomId}`); }, [roomId, router]);

  return (
    <div style={{padding:16}}>
      <div style={{marginBottom:12}}>
        <strong>Queue status:</strong> {status} <br/>
        <strong>Looking for:</strong> {type} <br/>
        <button onClick={() => enqueue(payload)} style={{marginTop:6}}>Re-Join</button>
        <button onClick={leave} style={{marginLeft:6}}>Leave</button>
      </div>
      <div style={{background:'#000',height:360,borderRadius:12}} />
    </div>
  );
}
