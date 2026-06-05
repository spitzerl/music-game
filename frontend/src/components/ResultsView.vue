<template>
  <section class="mx-auto max-w-3xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Résultats</h2>

    <ol class="mb-6 list-decimal pl-6">
      <li v-for="player in store.ranking" :key="player.id">
        {{ player.name }} — {{ player.score }} points
      </li>
    </ol>

    <article v-for="music in store.musics" :key="music.id" class="mb-3 rounded bg-slate-900 p-3">
      <p>{{ music.title }} — {{ music.artist }} (joueur #{{ music.player_id }})</p>
    </article>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const store = useGameStore();

onMounted(async () => {
  await store.loadResults(route.params.code);
});
</script>
