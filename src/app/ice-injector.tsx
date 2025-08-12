'use client';
import { useEffect } from 'react';

export default function IceInjector() {
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/turn', { cache: 'no-store' });
        const j = await r.json();
        const ice = Array.isArray(j?.iceServers) ? j.iceServers : (Array.isArray(j) ? j : []);
        if (!ice.length) { console.warn('[ICE] no servers from /api/turn'); return; }

        const NativePC: any = (window as any).RTCPeerConnection;
        if (!NativePC) return;
        if ((window as any).__ICE_WRAPPED__) return;

        const Wrapped: any = function(config?: RTCConfiguration, constraints?: any) {
          const merged: RTCConfiguration = {
            ...(config || {}),
            iceServers: (config?.iceServers && config.iceServers.length) ? config.iceServers : ice,
          };
          return new NativePC(merged, constraints);
        };
        Wrapped.prototype = NativePC.prototype;
        (window as any).RTCPeerConnection = Wrapped;
        (window as any).__ICE_WRAPPED__ = true;
        console.log('[ICE] injector active; servers=', ice);
      } catch (e) {
        console.error('[ICE] injector error', e);
      }
    })();
  }, []);
  return null;
}
