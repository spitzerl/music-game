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
  getSession(code) {
    return api.get(`/sessions/${code}`);
  },
  addMusic(code, payload) {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => form.append(key, value));
    return api.post(`/sessions/${code}/musics`, form);
  },
  startVoting(code) {
    return api.post(`/sessions/${code}/start-voting`);
  },
  submitVote(code, payload) {
    return api.post(`/sessions/${code}/votes`, payload);
  },
  getResults(code) {
    return api.get(`/sessions/${code}/results`);
  },
  finishSession(code) {
    return api.post(`/sessions/${code}/finish`);
  },
};
