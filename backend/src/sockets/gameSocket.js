export default function registerGameSocket(ioNamespace, gameService) {
  ioNamespace.on('connection', (socket) => {
    socket.on('join', async ({ code }) => {
      try {
        if (!code || typeof code !== 'string') {
          return;
        }

        const sessionCode = code.trim().toUpperCase();
        socket.join(sessionCode);
        socket.emit('state:update', await gameService.getState(sessionCode));
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });

    socket.on('music:add', async ({ code }) => {
      try {
        if (!code || typeof code !== 'string') {
          return;
        }

        const sessionCode = code.trim().toUpperCase();
        ioNamespace.to(sessionCode).emit('state:update', await gameService.getState(sessionCode));
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });

    socket.on('vote:submit', async ({ code }) => {
      try {
        if (!code || typeof code !== 'string') {
          return;
        }

        const sessionCode = code.trim().toUpperCase();
        ioNamespace.to(sessionCode).emit('state:update', await gameService.getState(sessionCode));
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });
  });
}
