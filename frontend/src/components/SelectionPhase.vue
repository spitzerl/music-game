<template>
  <section class="mx-auto max-w-3xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Phase de sélection</h2>

    <form class="grid gap-3" @submit.prevent="submit">
      <input v-model="title" required class="rounded px-3 py-2" placeholder="Titre" />
      <input v-model="artist" required class="rounded px-3 py-2" placeholder="Artiste" />
      <input required type="file" accept="audio/*" @change="onFileChange" />
      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white">Envoyer musique</button>
    </form>

    <ul class="mt-6 list-disc pl-6">
      <li v-for="music in store.musics" :key="music.id">{{ music.title }} — {{ music.artist }}</li>
    </ul>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '../services/apiService';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const store = useGameStore();

const title = ref('');
const artist = ref('');
const audio = ref(null);

const onFileChange = (event) => {
  audio.value = event.target.files?.[0] || null;
};

const submit = async () => {
  if (!audio.value || !store.player?.id) {
    return;
  }

  await apiService.addMusic(route.params.code, {
    playerId: String(store.player.id),
    title: title.value,
    artist: artist.value,
    audio: audio.value,
  });

  await store.loadSession(route.params.code);
  title.value = '';
  artist.value = '';
  audio.value = null;
};
</script>
