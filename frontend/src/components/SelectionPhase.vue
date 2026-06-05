<template>
  <section class="mx-auto max-w-3xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Phase de sélection</h2>

    <form class="grid gap-3" @submit.prevent="submit">
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          class="w-full rounded px-3 py-2"
          placeholder="Rechercher un morceau sur Deezer"
          @keyup.enter.prevent="searchTracks"
        />
        <button
          type="button"
          class="rounded bg-slate-700 px-4 py-2 font-semibold text-white"
          :disabled="isSearching"
          @click="searchTracks"
        >
          {{ isSearching ? 'Recherche...' : 'Rechercher' }}
        </button>
      </div>

      <p v-if="searchError" class="text-sm text-red-400">{{ searchError }}</p>

      <ul v-if="tracks.length" class="max-h-64 space-y-2 overflow-auto rounded border border-slate-700 p-3">
        <li
          v-for="track in tracks"
          :key="track.id"
          class="flex items-center justify-between gap-3 rounded bg-slate-900 p-2"
        >
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ track.title }}</p>
            <p class="truncate text-sm text-slate-300">{{ track.artist }}</p>
          </div>
          <button type="button" class="rounded bg-cyan-500 px-3 py-1 text-sm font-semibold text-white" @click="selectedTrack = track">
            Choisir
          </button>
        </li>
      </ul>

      <p v-if="selectedTrack" class="text-sm text-emerald-400">
        Morceau choisi: {{ selectedTrack.title }} — {{ selectedTrack.artist }}
      </p>

      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white" :disabled="!selectedTrack">
        Envoyer musique
      </button>
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

const searchQuery = ref('');
const tracks = ref([]);
const selectedTrack = ref(null);
const isSearching = ref(false);
const searchError = ref('');

const searchTracks = async () => {
  if (!searchQuery.value.trim()) {
    tracks.value = [];
    selectedTrack.value = null;
    return;
  }

  isSearching.value = true;
  searchError.value = '';
  try {
    const { data } = await apiService.searchDeezer(searchQuery.value);
    tracks.value = data?.tracks || [];
    if (!tracks.value.length) {
      searchError.value = 'Aucun résultat Deezer trouvé.';
    }
  } catch {
    tracks.value = [];
    searchError.value = 'Recherche Deezer indisponible pour le moment.';
  } finally {
    isSearching.value = false;
  }
};

const submit = async () => {
  if (!selectedTrack.value || !store.player?.id) {
    return;
  }

  await apiService.addMusic(route.params.code, {
    playerId: String(store.player.id),
    title: selectedTrack.value.title,
    artist: selectedTrack.value.artist,
    deezerPreviewUrl: selectedTrack.value.preview,
  });

  await store.loadSession(route.params.code);
  selectedTrack.value = null;
  tracks.value = [];
  searchQuery.value = '';
};
</script>
