import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import CreateGame from '../components/CreateGame.vue';
import WaitingRoom from '../components/WaitingRoom.vue';
import SelectionPhase from '../components/SelectionPhase.vue';
import VotingPhase from '../components/VotingPhase.vue';
import ResultsView from '../components/ResultsView.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/create', component: CreateGame },
  { path: '/game/:code', component: WaitingRoom },
  { path: '/game/:code/selection', component: SelectionPhase },
  { path: '/game/:code/voting', component: VotingPhase },
  { path: '/game/:code/results', component: ResultsView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
