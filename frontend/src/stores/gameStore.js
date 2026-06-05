import { defineStore } from 'pinia';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

const CLIENT_ID_KEY = 'music-game-client-id';
const PLAYER_KEY_PREFIX = 'music-game-player-';

function getClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated = `player-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}

export const useGameStore = defineStore('game', {
  state: () => ({
    clientId: getClientId(),
    session: null,
    player: null,
    players: [],
    musics: [],
    currentRound: null,
    ranking: [],
    error: null,
    code: null,
    socketBound: false,
  }),
  getters: {
    isHost: (state) => !!state.player?.is_host,
    canVote: (state) => !!state.player?.can_vote,
    phase: (state) => state.session?.phase || 'waiting',
    myMusicCount: (state) => state.player ? (state.players.find((item) => item.id === state.player.id)?.musicCount || 0) : 0,
    maxMusicsPerPlayer: (state) => state.session?.max_musics_per_player || 0,
  },
  actions: {
    savePlayerId(code, playerId) {
      if (!code || !playerId) return;
      localStorage.setItem(`${PLAYER_KEY_PREFIX}${code}`, String(playerId));
    },
    getSavedPlayerId(code) {
      if (!code) return null;
      const raw = localStorage.getItem(`${PLAYER_KEY_PREFIX}${code}`);
      if (!raw) return null;
      const parsed = Number.parseInt(raw, 10);
      return Number.isInteger(parsed) ? parsed : null;
    },
    setError(error) {
      this.error = error?.response?.data?.error || error?.message || 'Erreur inconnue';
    },
    clearError() {
      this.error = null;
    },
    async createSession(hostName, config) {
      try {
        this.clearError();
        const { data } = await apiService.createSession(hostName, this.clientId, config);
        this.session = data.session;
        this.player = data.host;
        this.code = data.session.code;
        this.savePlayerId(data.session.code, data.host.id);
        return data;
      } catch (error) {
        this.setError(error);
        throw error;
      }
    },
    async joinSession(code, playerName) {
      try {
        this.clearError();
        const { data } = await apiService.joinSession(code, playerName, this.clientId);
        this.session = data.session;
        this.player = data.player;
        this.code = data.session.code;
        this.savePlayerId(data.session.code, data.player.id);
        return data;
      } catch (error) {
        this.setError(error);
        throw error;
      }
    },
    async loadSession(code = this.code) {
      try {
        if (!code) return null;
        const savedPlayerId = this.player?.id || this.getSavedPlayerId(code);
        const { data } = await apiService.getSession(code, savedPlayerId || null);
        this.session = data.session;
        this.players = data.players;
        this.musics = data.musics;
        this.currentRound = data.currentRound;
        this.ranking = data.ranking || [];
        this.code = code;

        if (savedPlayerId) {
          const refreshed = this.players.find((item) => item.id === savedPlayerId);
          if (refreshed) {
            this.player = refreshed;
            this.savePlayerId(code, refreshed.id);
          }
        }

        return data;
      } catch (error) {
        this.setError(error);
        throw error;
      }
    },
    connectSocket(code = this.code) {
      if (!code) return;

      if (!this.socketBound) {
        socketService.on('state:refresh', async ({ code: refreshCode }) => {
          if (refreshCode && this.code && refreshCode !== this.code) {
            return;
          }
          try {
            await this.loadSession(this.code || refreshCode);
          } catch {
            // handled in store error state
          }
        });
        socketService.on('game:error', ({ message }) => {
          this.error = message;
        });
        this.socketBound = true;
      }

      socketService.join(code, this.player?.id || null);
    },
    async updateConfig(config) {
      if (!this.code || !this.player?.id) return;
      await apiService.updateConfig(this.code, this.player.id, config);
      await this.loadSession(this.code);
    },
    async addBot(name) {
      if (!this.code || !this.player?.id) return;
      await apiService.addBot(this.code, this.player.id, name);
      await this.loadSession(this.code);
    },
    async startSelection() {
      if (!this.code || !this.player?.id) return;
      await apiService.startSelection(this.code, this.player.id);
      await this.loadSession(this.code);
    },
    async forceStartVoting() {
      if (!this.code || !this.player?.id) return;
      await apiService.startVoting(this.code, this.player.id);
      await this.loadSession(this.code);
    },
    async addMusic(payload) {
      if (!this.code) return;
      await apiService.addMusic(this.code, payload);
      await this.loadSession(this.code);
    },
    async removeMusic(musicId) {
      if (!this.code || !this.player?.id) return;
      await apiService.removeMusic(this.code, musicId, this.player.id);
      await this.loadSession(this.code);
    },
    async submitVote(guessedPlayerId) {
      if (!this.code || !this.player?.id) return;
      await apiService.submitVote(this.code, {
        voterId: this.player.id,
        guessedPlayerId,
      });
      await this.loadSession(this.code);
    },
    async relaunch() {
      if (!this.code || !this.player?.id) return;
      await apiService.relaunchSession(this.code, this.player.id);
      await this.loadSession(this.code);
    },
  },
});
