'use client';

import { useEffect, useRef, useState } from 'react';

export default function WebRTCTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'running' | 'error'>('idle');
  const [err, setErr] = useState<string>('');
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);

  useEffect(() => {
    setStatus('ready');
  }, []);

  const start = async () => {
    setErr('');
    setStatus('running');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio, video });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      setStatus('error');
      setErr(e?.message || 'getUserMedia failed');
    }
  };

  const stop = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('ready');
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>WebRTC Local Test</h1>
      <p style={{ marginBottom: 16 }}>
        اختبر أذونات الكاميرا والمايك بدون مطابقة أو سوكِت. يفترض أن ترى فيديوك المحلي بعد الضغط على Start.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={audio} onChange={e => setAudio(e.target.checked)} />
          Audio
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={video} onChange={e => setVideo(e.target.checked)} />
          Video
        </label>

        {status !== 'running' ? (
          <button onClick={start} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #ddd', cursor: 'pointer' }}>
            Start
          </button>
        ) : (
          <button onClick={stop} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #ddd', cursor: 'pointer' }}>
            Stop
          </button>
        )}
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>Error: {err}</div>}

      <video
        ref={videoRef}
        playsInline
        muted
        style={{ width: '100%', maxHeight: 480, background: '#000', borderRadius: 12 }}
      />

      <div style={{ marginTop: 12, color: '#666' }}>
        Status: <b>{status}</b> {stream && <>| Tracks: {stream.getTracks().length}</>}
      </div>
    </div>
  );
}
