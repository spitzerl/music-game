<template>
  <section class="mx-auto max-w-3xl p-6">
    <h2 class="mb-2 text-2xl font-bold">Salon {{ route.params.code }}</h2>
    <p class="mb-4">Phase actuelle : {{ store.session?.phase || 'selection' }}</p>

    <ul class="mb-6 list-disc pl-6">
      <li v-for="player in store.players" :key="player.id">{{ player.name }} ({{ player.score }} pts)</li>
    </ul>

    <div class="flex gap-3">
      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white" @click="goSelection">Ajouter une musique</button>
      <button class="rounded bg-indigo-500 px-4 py-2 font-semibold text-white" @click="startVoting">Lancer les votes</button>
      <button class="rounded bg-emerald-500 px-4 py-2 font-semibold text-white" @click="finish">Voir résultats</button>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiService from '../services/apiService';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

onMounted(async () => {
  await store.loadSession(route.params.code);
  store.connectSocket(route.params.code);
});

const goSelection = () => router.push(`/game/${route.params.code}/selection`);

const startVoting = async () => {
  await apiService.startVoting(route.params.code);
  router.push(`/game/${route.params.code}/voting`);
};

const finish = async () => {
  await apiService.finishSession(route.params.code);
  router.push(`/game/${route.params.code}/results`);
};
</script>
