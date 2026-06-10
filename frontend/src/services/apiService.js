import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export default {
  createSession(hostName) {
    return api.post('/sessions', { hostName });
  },
  joinSession(code, playerName) {
    return api.post(`/sessions/${code}/join`, { playerName });
  },
  getSession(code, playerId = null) {
    return api.get(`/sessions/${code}`, { params: { playerId } });
  },
  updateConfig(code, config) {
    return api.post(`/sessions/${code}/config`, config);
  },
  addBot(code) {
    return api.post(`/sessions/${code}/bots`);
  },
  startSelection(code) {
    return api.post(`/sessions/${code}/start-selection`);
  },
  startRound(code) {
    return api.post(`/sessions/${code}/start-round`);
  },
  addMusic(code, payload) {
    if (payload.audio instanceof File) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => form.append(key, value));
      return api.post(`/sessions/${code}/musics`, form);
    }
    return api.post(`/sessions/${code}/musics`, payload);
  },
  deleteMusic(code, musicId, playerId) {
    return api.delete(`/sessions/${code}/musics/${musicId}`, { params: { playerId } });
  },
  searchDeezer(query) {
    return api.get('/deezer/search', {
      params: {
        q: query,
      },
    });
  },
  startVoting(code) {
    return api.post(`/sessions/${code}/start-voting`);
  },
  submitVote(code, payload) {
    return api.post(`/sessions/${code}/votes`, payload);
  },
  submitBlindTestAnswer(code, payload) {
    return api.post(`/sessions/${code}/blind-test-answers`, payload);
  },
  getResults(code) {
    return api.get(`/sessions/${code}/results`);
  },
  finishSession(code) {
    return api.post(`/sessions/${code}/finish`);
  },
  resetSession(code) {
    return api.post(`/sessions/${code}/reset`);
  },
  promotePlayer(code, requesterId, targetPlayerId) {
    return api.post(`/sessions/${code}/players/${targetPlayerId}/promote`, { requesterId });
  },
  kickPlayer(code, requesterId, targetPlayerId) {
    return api.post(`/sessions/${code}/players/${targetPlayerId}/kick`, { requesterId });
  },
  advanceRound(code) {
    return api.post(`/sessions/${code}/advance-round`);
  },
  searchDeezer(query = '') {
    return api.get('/deezer/search', { params: { q: query } });
  },
};
