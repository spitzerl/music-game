import Player from '../models/Player.js';
import Session from '../models/Session.js';
import { query } from '../config/database.js';

export default function registerGameSocket(ioNamespace, gameService) {
  ioNamespace.on('connection', (socket) => {
    socket.on('join', async ({ code, playerId }) => {
      try {
        if (!code || typeof code !== 'string') {
          return;
        }

        const sessionCode = code.trim().toUpperCase();
        socket.join(sessionCode);
        
        if (playerId) {
          const parsedPlayerId = Number.parseInt(playerId, 10);
          socket.playerId = parsedPlayerId;
          socket.code = sessionCode;

          // Update connection status to connected
          await Player.updateConnectionStatus(parsedPlayerId, true);
          gameService.log(sessionCode, `Socket connected for player ${parsedPlayerId}`);
        }

        // Send state to this client
        const state = await gameService.getState(sessionCode, playerId);
        socket.emit('state:update', state);

        // Broadcast updated players list to everyone else
        await gameService.broadcastState(sessionCode);
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });

    socket.on('disconnect', async () => {
      const code = socket.code;
      const playerId = socket.playerId;

      if (code && playerId) {
        try {
          // Check if there are other sockets for this player in the same room
          const sockets = await ioNamespace.in(code).fetchSockets();
          const anotherSocketExists = sockets.some(s => s.playerId === playerId && s.id !== socket.id);

          if (!anotherSocketExists) {
            // No other socket, player disconnected!
            const player = await Player.updateConnectionStatus(playerId, false);
            gameService.log(code, `Player ${playerId} marked as disconnected`);

            const session = await Session.findByCode(code);
            if (session && player && player.name === session.host_name) {
              gameService.log(code, `Host disconnected, deleting session`);
              // Delete session (cascade will delete players, musics, votes)
              await query('DELETE FROM sessions WHERE id = $1', [session.id]);
              ioNamespace.to(code).emit('session:deleted');
              // Clear timer
              gameService.clearTimer(code);
              return;
            }

            await gameService.broadcastState(code);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
}
