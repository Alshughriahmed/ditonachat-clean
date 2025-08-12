'use client';
import { useMemo, useRef, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

function getIceServers() {
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  const servers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302'] },
  ];
  if (turnUrl && turnUser && turnCred) {
    servers.push({ urls: [turnUrl], username: turnUser, credential: turnCred });
  }
  return servers;
}

export default function RoomPage({ params }: { params: { room: string } }) {
  const roomId = params.room;
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<'idle'|'ready'|'calling'|'in-call'|'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const push = (s: string) => setLog(L => [...L.slice(-300), `${new Date().toISOString()} ${s}`]);

  const baseUrl = useMemo(() =>
    (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://localhost:3000', []);

  async function start() {
    try {
      push('start clicked');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideo.current) {
        localVideo.current.srcObject = stream;
        localVideo.current.muted = true;
        await localVideo.current.play().catch(()=>{});
      }

      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      pcRef.current = pc;

      // Debug عميق لحالات ICE/Connection
      pc.oniceconnectionstatechange = () => push('iceConnectionState=' + pc.iceConnectionState);
      pc.onconnectionstatechange   = () => push('connectionState=' + pc.connectionState);
      pc.onicegatheringstatechange = () => push('iceGathering=' + pc.iceGatheringState);

      // اطلب استقبال مسارات الطرف الآخر صراحة
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // أضف مساراتك
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        push('ontrack streams=' + e.streams.length);
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
          remoteVideo.current.play().catch(()=>{});
        }
        setStatus('in-call');
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          push('local candidate ' + (e.candidate.type || ''));
          socketRef.current?.emit('rtc:candidate', { roomId, candidate: e.candidate });
        } else {
          push('ice candidate gathering complete');
        }
      };

      const s = io(baseUrl, { path: '/api/socket', transports: ['websocket','polling'], upgrade: true, withCredentials: true });
      socketRef.current = s;

      s.on('connect', () => push('socket connected'));
      s.on('disconnect', () => push('socket disconnected'));

      s.emit('rtc:join', { roomId });
      let isCaller = false;

      s.on('rtc:roomSize', (size: number) => { push('roomSize=' + size); if (size === 1) isCaller = true; });
      s.on('rtc:ready', async () => {
        setStatus('ready'); push('rtc:ready');
        if (isCaller && pc.signalingState === 'stable') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          s.emit('rtc:offer', { roomId, sdp: offer });
          setStatus('calling'); push('sent offer');
        }
      });

      s.on('rtc:offer', async ({ sdp }) => {
        push('recv offer');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit('rtc:answer', { roomId, sdp: answer });
        push('sent answer');
      });

      s.on('rtc:answer', async ({ sdp }) => {
        push('recv answer');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        setStatus('in-call');
      });

      s.on('rtc:candidate', async ({ candidate }) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); push('recv candidate'); }
        catch (e:any) { push('candidate error '+e.message); }
      });

      s.on('rtc:peer-left', () => { push('peer left'); setStatus('ready'); });
    } catch (e:any) {
      setStatus('error'); push('init error ' + e.message);
      alert('Camera/Mic blocked. افتح الصفحة في تبويب خارجي واسمح بالأذونات، ثم أعد المحاولة.');
    }
  }

  useEffect(()=>{ /* autoplay hint للمستخدم */ },[]);

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div>
        <h3>Local (-)</h3>
        <video ref={localVideo} playsInline muted style={{width:'100%',background:'#000',borderRadius:12}} />
        <div style={{marginTop:8}}>
          <button onClick={start} style={{padding:'8px 12px'}}>Start camera & join</button>
        </div>
      </div>
      <div>
        <h3>Remote</h3>
        <video ref={remoteVideo} playsInline style={{width:'100%',background:'#000',borderRadius:12}} />
      </div>
      <div style={{gridColumn:'1 / -1'}}>
        <div>Status: {status}</div>
        <pre style={{maxHeight:220,overflow:'auto',background:'#111',color:'#0f0',padding:8,borderRadius:8}}>
{log.join('\n')}
        </pre>
        <a href="/chat" style={{display:'inline-block',marginTop:8}}>⬅ Back</a>
      </div>
    </div>
  );
}
