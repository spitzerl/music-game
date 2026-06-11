import { defineStore } from 'pinia';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

export const useGameStore = defineStore('game', {
  state: () => ({
    session: null,
    player: JSON.parse(localStorage.getItem('music_game_player')) || null,
    players: [],
    musics: [],
    currentMusic: null,
    votes: null,
    musicCounts: null,
    ranking: [],
    error: null,
    notifications: [],
  }),
  actions: {
    async createSession(hostName) {
      const { data } = await apiService.createSession(hostName);
      this.session = data.session;
      this.player = data.host;
      localStorage.setItem('music_game_player', JSON.stringify(data.host));
      return data;
    },
    async joinSession(code, playerName) {
      const { data } = await apiService.joinSession(code, playerName);
      this.session = data.session;
      this.player = data.player;
      localStorage.setItem('music_game_player', JSON.stringify(data.player));
      return data;
    },
    async loadSession(code) {
      const playerId = this.player?.id || null;
      const { data } = await apiService.getSession(code, playerId);
      this.session = data.session;
      this.players = data.players;
      this.musics = data.musics || [];
      this.currentMusic = data.currentMusic || null;
      this.votes = data.votes || null;
      this.musicCounts = data.musicCounts || null;
      // Sync the current player object from the server (keeps id/session_id accurate after refresh)
      if (data.player) {
        this.player = data.player;
        localStorage.setItem('music_game_player', JSON.stringify(data.player));
      }
      return data;
    },
    async updateConfig(config) {
      if (!this.session) return;
      const { data } = await apiService.updateConfig(this.session.code, config);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async addBot() {
      if (!this.session) return;
      const { data } = await apiService.addBot(this.session.code);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async startSelection() {
      if (!this.session) return;
      const { data } = await apiService.startSelection(this.session.code);
      this.session = data.session;
      this.players = data.players;
      this.musics = data.musics || [];
      return data;
    },
    async startRound() {
      if (!this.session) return;
      const { data } = await apiService.startRound(this.session.code);
      this.session = data.session;
      this.players = data.players;
      this.musics = data.musics || [];
      return data;
    },
    async deleteMusic(musicId) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.deleteMusic(this.session.code, musicId, this.player.id);
      this.session = data.session;
      this.players = data.players;
      this.musics = data.musics || [];
      return data;
    },
    async startVoting() {
      if (!this.session) return;
      const { data } = await apiService.startVoting(this.session.code);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async submitVote(musicId, guessedPlayerId) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.submitVote(this.session.code, {
        voterId: this.player.id,
        musicId,
        guessedPlayerId,
      });
      this.session = data.session;
      this.players = data.players;
      this.currentMusic = data.currentMusic || null;
      this.votes = data.votes || null;
      return data;
    },
    async submitBlindTestAnswer(musicId, answerTitle, answerArtist) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.submitBlindTestAnswer(this.session.code, {
        playerId: this.player.id,
        musicId,
        answerTitle,
        answerArtist,
      });
      this.session = data.session;
      this.players = data.players;
      this.currentMusic = data.currentMusic || null;
      this.votes = data.votes || null;
      return data;
    },
    async loadResults(code) {
      const { data } = await apiService.getResults(code);
      this.ranking = data.ranking;
      this.players = data.players;
      this.musics = data.musics || [];
      this.session = data.session;
      this.votes = data.votes || null;
      return data;
    },
    async resetSession() {
      if (!this.session) return;
      const { data } = await apiService.resetSession(this.session.code);
      this.session = data.session;
      this.players = data.players;
      this.musics = [];
      this.currentMusic = null;
      this.votes = null;
      return data;
    },
    async promotePlayer(targetPlayerId) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.promotePlayer(this.session.code, this.player.id, targetPlayerId);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async kickPlayer(targetPlayerId) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.kickPlayer(this.session.code, this.player.id, targetPlayerId);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async advanceRound() {
      if (!this.session) return;
      const { data } = await apiService.advanceRound(this.session.code);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    async regenerateAvatar(playerId) {
      if (!this.session || !this.player) return;
      const { data } = await apiService.regenerateAvatar(this.session.code, playerId);
      this.session = data.session;
      this.players = data.players;
      return data;
    },
    addNotification(message, type = 'info') {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      if (this.notifications.length >= 3) {
        this.notifications.shift();
      }
      this.notifications.push({ id, message, type });
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 5000);
    },
    connectSocket(code) {
      const playerId = this.player?.id || null;

      // Clean up previous listeners to prevent duplicate joins & memory leaks
      socketService.off('state:update');
      socketService.off('sound:play');
      socketService.off('player:kicked');
      socketService.off('session:deleted');
      socketService.off('player:status');
      socketService.off('connect');
      socketService.off('disconnect');

      socketService.join(code, playerId);
      
      socketService.on('state:update', (state) => {
        this.session = state.session;
        this.players = state.players;
        this.musics = state.musics || [];
        this.currentMusic = state.currentMusic || null;
        this.votes = state.votes || null;
        this.musicCounts = state.musicCounts || null;
      });

      socketService.on('sound:play', ({ type }) => {
        import('../services/soundService.js').then((module) => {
          module.default.play(type);
        });
      });

      socketService.on('player:kicked', () => {
        alert("Vous avez été exclu (kicked) de la partie par l'hôte.");
        this.session = null;
        this.player = null;
        this.players = [];
        this.musics = [];
        this.currentMusic = null;
        this.votes = null;
        localStorage.removeItem('music_game_player');
        window.location.href = '/';
      });

      socketService.on('session:deleted', () => {
        alert("L'hôte a quitté ou la partie a été supprimée. Retour à l'accueil.");
        this.session = null;
        this.player = null;
        this.players = [];
        this.musics = [];
        this.currentMusic = null;
        this.votes = null;
        localStorage.removeItem('music_game_player');
        window.location.href = '/';
      });

      // Show notifications when other players connect or disconnect
      socketService.on('player:status', ({ playerId: pId, playerName, isConnected }) => {
        if (pId !== this.player?.id) {
          const statusText = isConnected ? 'reconnecté' : 'déconnecté';
          const type = isConnected ? 'success' : 'warning';
          this.addNotification(`${playerName} s'est ${statusText}`, type);
        }
      });

      // Show notifications when local player connects or disconnects
      socketService.on('connect', () => {
        this.addNotification("Vous êtes connecté au serveur de jeu", "success");
      });

      socketService.on('disconnect', (reason) => {
        if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
          this.addNotification("Connexion perdue. Tentative de reconnexion...", "error");
        }
      });
    },
    disconnectSocket() {
      socketService.disconnect();
    },
    leaveSession() {
      this.disconnectSocket();
      this.session = null;
      this.player = null;
      this.players = [];
      this.musics = [];
      this.currentMusic = null;
      this.votes = null;
      localStorage.removeItem('music_game_player');
    }
  },
});
