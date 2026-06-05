<template>
  <section class="mx-auto max-w-3xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Phase de vote</h2>

    <article v-for="music in store.musics" :key="music.id" class="mb-6 rounded bg-slate-900 p-4">
      <h3 class="mb-2 text-lg font-semibold">{{ music.title }}</h3>
      <audio class="mb-3 w-full" controls :src="audioUrl(music.file_path)"></audio>
      <select v-model="guesses[music.id]" class="w-full rounded px-3 py-2">
        <option disabled value="">Qui a proposé ce morceau ?</option>
        <option v-for="player in store.players" :key="player.id" :value="player.id">{{ player.name }}</option>
      </select>
      <button class="mt-3 rounded bg-indigo-500 px-4 py-2 font-semibold text-white" @click="vote(music.id)">Valider</button>
    </article>
  </section>
</template>

<script setup>
import { reactive } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '../services/apiService';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const store = useGameStore();
const guesses = reactive({});

const origin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const audioUrl = (path) => `${origin}${path}`;

const vote = async (musicId) => {
  const guessedPlayerId = Number.parseInt(guesses[musicId], 10);
  if (!store.player?.id || !guessedPlayerId) {
    return;
  }

  await apiService.submitVote(route.params.code, {
    voterId: store.player.id,
    musicId,
    guessedPlayerId,
  });
};
</script>
