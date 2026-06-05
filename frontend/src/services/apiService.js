import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export default {
  createSession(hostName, clientId, config) {
    return api.post('/sessions', { hostName, clientId, config });
  },
  joinSession(code, playerName, clientId) {
    return api.post(`/sessions/${code}/join`, { playerName, clientId });
  },
  getSession(code, playerId) {
    return api.get(`/sessions/${code}`, {
      params: {
        playerId,
      },
    });
  },
  updateConfig(code, hostPlayerId, config) {
    return api.patch(`/sessions/${code}/config`, { hostPlayerId, config });
  },
  addBot(code, hostPlayerId, name) {
    return api.post(`/sessions/${code}/bots`, { hostPlayerId, name });
  },
  startSelection(code, hostPlayerId) {
    return api.post(`/sessions/${code}/start-selection`, { hostPlayerId });
  },
  startVoting(code, hostPlayerId) {
    return api.post(`/sessions/${code}/start-voting`, { hostPlayerId });
  },
  addMusic(code, payload) {
    if (payload.audio instanceof File) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => form.append(key, value));
      return api.post(`/sessions/${code}/musics`, form);
    }
    return api.post(`/sessions/${code}/musics`, payload);
  },
  removeMusic(code, musicId, playerId) {
    return api.delete(`/sessions/${code}/musics/${musicId}`, {
      data: { playerId },
    });
  },
  searchDeezer(query) {
    return api.get('/deezer/search', {
      params: {
        q: query,
      },
    });
  },
  submitVote(code, payload) {
    return api.post(`/sessions/${code}/votes`, payload);
  },
  relaunchSession(code, hostPlayerId) {
    return api.post(`/sessions/${code}/relaunch`, { hostPlayerId });
  },
  getResults(code) {
    return api.get(`/sessions/${code}/results`);
  },
};
