export default function registerGameSocket(ioNamespace, gameService) {
  const socketSessions = new Map();

  ioNamespace.on('connection', (socket) => {
    socket.on('join', async ({ code, playerId }) => {
      try {
        if (!code || typeof code !== 'string') {
          return;
        }

        const sessionCode = code.trim().toUpperCase();
        socket.join(sessionCode);

        if (playerId) {
          await gameService.markPlayerConnected(sessionCode, Number.parseInt(playerId, 10));
          socketSessions.set(socket.id, {
            code: sessionCode,
            playerId: Number.parseInt(playerId, 10),
          });
        }

        socket.emit('state:refresh', { code: sessionCode });
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });

    socket.on('leave', async () => {
      const current = socketSessions.get(socket.id);
      if (!current) return;

      socketSessions.delete(socket.id);
      await gameService.markPlayerDisconnected(current.code, current.playerId);
    });

    socket.on('disconnect', async () => {
      const current = socketSessions.get(socket.id);
      if (!current) return;

      socketSessions.delete(socket.id);
      await gameService.markPlayerDisconnected(current.code, current.playerId);
    });
  });
}
