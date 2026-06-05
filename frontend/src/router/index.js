import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import CreateGame from '../components/CreateGame.vue';
import WaitingRoom from '../components/WaitingRoom.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/create', component: CreateGame },
  { path: '/game/:code', component: WaitingRoom },
  { path: '/game/:code/selection', redirect: (to) => `/game/${to.params.code}` },
  { path: '/game/:code/voting', redirect: (to) => `/game/${to.params.code}` },
  { path: '/game/:code/results', redirect: (to) => `/game/${to.params.code}` },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
