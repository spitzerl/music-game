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
    connectSocket(code) {
      const playerId = this.player?.id || null;
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
