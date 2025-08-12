// Socket.IO + Matching + WebRTC signaling
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';
import { Server as IOServer, type Socket } from 'socket.io';

type QueueItem = { userId: string; socketId: string };
const queue: QueueItem[] = [];
const rooms = new Map<string, Set<string>>(); // roomId -> socketIds

export const config = { api: { bodyParser: false } };

function removeFromQueueBySocket(socketId: string) {
  const i = queue.findIndex(q => q.socketId === socketId);
  if (i >= 0) queue.splice(i, 1);
}

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server as any, {
      path: '/api/socket',
      cors: { origin: true, credentials: true },
      transports: ['websocket','polling'],
    });
    res.socket.server.io = io;

    io.on('connection', (socket: Socket) => {
      const userId = (socket.handshake.query?.userId as string) || socket.id;
      socket.join(userId);
      console.log('[socket] connected', { userId, id: socket.id });

      // === Matching (بسيط) ===
      socket.on('matching:enqueue', () => {
        for (let i = queue.length - 1; i >= 0; i--) {
          if (queue[i].userId === userId || queue[i].socketId === socket.id) queue.splice(i, 1);
        }
        queue.push({ userId, socketId: socket.id });
        console.log('[queue] enqueue', { size: queue.length, userId });

        if (queue.length >= 2) {
          const a = queue.shift()!;
          const b = queue.shift()!;
          const roomId = `room-${Date.now()}`;
          io.to(a.userId).emit('matching:matchFound', roomId);
          io.to(b.userId).emit('matching:matchFound', roomId);
          console.log('[queue] match', { a: a.userId, b: b.userId, roomId });
        } else {
          io.to(userId).emit('matching:noMatch');
        }
      });

      socket.on('matching:leave', () => {
        for (let i = queue.length - 1; i >= 0; i--) {
          if (queue[i].socketId === socket.id || queue[i].userId === userId) queue.splice(i, 1);
        }
        console.log('[queue] leave', { userId, size: queue.length });
      });

      // === Rooms & WebRTC signaling ===
      socket.on('room:join', ({ roomId }: { roomId: string }) => {
        socket.join(roomId);
        let set = rooms.get(roomId);
        if (!set) { set = new Set(); rooms.set(roomId, set); }
        set.add(socket.id);
        console.log('[room] join', roomId, 'size', set.size);

        if (set.size === 1) {
          socket.emit('room:role', { role: 'wait' });
        } else {
          // ثاني داخل الغرفة يصبح "caller" افتراضيًا
          socket.emit('room:role', { role: 'caller' });
          socket.to(roomId).emit('room:role', { role: 'callee' });
        }
      });

      socket.on('room:leave', ({ roomId }: { roomId: string }) => {
        socket.leave(roomId);
        const set = rooms.get(roomId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) rooms.delete(roomId);
        }
        socket.to(roomId).emit('room:peer-left');
      });

      socket.on('rtc:offer', ({ roomId, sdp }) => {
        socket.to(roomId).emit('rtc:offer', { sdp });
      });
      socket.on('rtc:answer', ({ roomId, sdp }) => {
        socket.to(roomId).emit('rtc:answer', { sdp });
      });
      socket.on('rtc:ice', ({ roomId, candidate }) => {
        socket.to(roomId).emit('rtc:ice', { candidate });
      });

      socket.on('disconnect', () => {
        removeFromQueueBySocket(socket.id);
        for (const [rid, set] of rooms) {
          if (set.delete(socket.id)) {
            socket.to(rid).emit('room:peer-left');
            if (set.size === 0) rooms.delete(rid);
          }
        }
        console.log('[socket] disconnected', { userId });
      });
    });

    console.log('✅ Socket.IO server started at /api/socket');
  }
  res.end();
}
