import { io } from 'socket.io-client';

let socket;

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export default {
  connect() {
    if (!socket) {
      socket = io(`${socketUrl}/game`, {
        transports: ['websocket', 'polling'],
      });
    }
    return socket;
  },
  join(code) {
    this.connect().emit('join', { code });
  },
  on(event, callback) {
    this.connect().on(event, callback);
  },
  off(event, callback) {
    if (!socket) return;
    socket.off(event, callback);
  },
};
