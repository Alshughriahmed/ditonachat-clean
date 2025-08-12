'use client';
import { useState } from 'react';
export default function Diag() {
  const [log, setLog] = useState<string[]>([]);
  const [relay, setRelay] = useState<'unknown'|'yes'|'no'>('unknown');
  const [used, setUsed] = useState<string>('');
  const push = (s:string)=>setLog(L=>[...L.slice(-300), new Date().toISOString()+' '+s]);

  async function run(){
    setLog([]); setRelay('unknown'); setUsed('');
    push('fetching /api/turn ...');
    let iceServers: RTCIceServer[] = [];
    try{
      const r = await fetch('/api/turn', { cache: 'no-store' });
      const j = await r.json();
      iceServers = Array.isArray(j?.iceServers) ? j.iceServers : [];
      setUsed(JSON.stringify(iceServers, null, 2));
      push('got iceServers: '+iceServers.length);
    }catch(e:any){ push('turn fetch error: '+e.message); }
    if (!iceServers.length) { iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }]; push('fallback STUN only'); }

    const pc = new RTCPeerConnection({ iceServers });
    const types = new Set<string>();
    pc.onicecandidate = (e)=>{
      if (!e.candidate) { push('gathering complete'); return; }
      const m = / typ (\w+)/.exec(e.candidate.candidate);
      const t = m?.[1] || 'unknown';
      types.add(t);
      if (t==='relay') setRelay('yes');
      push('candidate '+t);
    };
    pc.oniceconnectionstatechange = ()=>push('ice='+pc.iceConnectionState);
    pc.createDataChannel('t');
    const off = await pc.createOffer(); await pc.setLocalDescription(off);
    await new Promise<void>(res=>{
      const done = ()=>pc.iceGatheringState==='complete' && res();
      pc.onicegatheringstatechange = done; setTimeout(()=>res(), 3500);
    });
    if (!Array.from(types).includes('relay')) setRelay('no');
    pc.close();
    push('types='+Array.from(types).join(','));
  }

  return <div style={{padding:16}}>
    <h2>WebRTC Diag</h2>
    <button onClick={run}>Run</button>
    <div style={{marginTop:8}}>TURN relay: <b>{relay==='yes'?'✅ available':relay==='no'?'❌ not found':'…'}</b></div>
    <details style={{margin:'8px 0'}}><summary>ICE servers used</summary><pre style={{whiteSpace:'pre-wrap'}}>{used}</pre></details>
    <pre style={{whiteSpace:'pre-wrap',background:'#111',color:'#0f0',padding:8,maxHeight:300,overflow:'auto'}}>{log.join('\n')}</pre>
  </div>;
}
