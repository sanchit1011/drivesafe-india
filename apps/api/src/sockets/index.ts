import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { SOCKET_EVENTS } from '@drivesafe/shared';

export function setupSockets(io: Server): void {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.debug(`Socket connected: ${user?.userId} (${user?.role})`);

    // Join booking room
    socket.on(SOCKET_EVENTS.JOIN_BOOKING_ROOM, (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      logger.debug(`${user?.userId} joined booking:${bookingId}`);
    });

    // Leave booking room
    socket.on(SOCKET_EVENTS.LEAVE_BOOKING_ROOM, (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });

    // Driver sends location update
    socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, (data: { bookingId: string; lat: number; lng: number }) => {
      if (user?.role !== 'DRIVER') return;
      
      // Broadcast to booking room
      io.to(`booking:${data.bookingId}`).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${user?.userId}`);
    });
  });
}

// Helper to emit booking status updates from controllers
export function emitBookingUpdate(io: Server, bookingId: string, status: string, data?: any): void {
  io.to(`booking:${bookingId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_UPDATE, {
    bookingId,
    status,
    data,
    timestamp: new Date(),
  });
}
