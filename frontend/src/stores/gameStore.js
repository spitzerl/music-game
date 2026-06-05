import { defineStore } from 'pinia';
import apiService from '../services/apiService';
import socketService from '../services/socketService';

export const useGameStore = defineStore('game', {
  state: () => ({
    session: null,
    player: null,
    players: [],
    musics: [],
    ranking: [],
    error: null,
  }),
  actions: {
    async createSession(hostName) {
      const { data } = await apiService.createSession(hostName);
      this.session = data.session;
      this.player = data.host;
      return data;
    },
    async joinSession(code, playerName) {
      const { data } = await apiService.joinSession(code, playerName);
      this.session = data.session;
      this.player = data.player;
      return data;
    },
    async loadSession(code) {
      const { data } = await apiService.getSession(code);
      this.session = data.session;
      this.players = data.players;
      this.musics = data.musics;
      return data;
    },
    async loadResults(code) {
      const { data } = await apiService.getResults(code);
      this.ranking = data.ranking;
      this.players = data.players;
      this.musics = data.musics;
      this.session = data.session;
      return data;
    },
    connectSocket(code) {
      socketService.join(code);
      socketService.on('state:update', (state) => {
        this.session = state.session;
        this.players = state.players;
        this.musics = state.musics;
      });
    },
  },
});
