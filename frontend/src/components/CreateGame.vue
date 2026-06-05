<template>
  <section class="mx-auto max-w-xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Créer une partie</h2>

    <form class="grid gap-4" @submit.prevent="submit">
      <input v-model="hostName" required class="w-full rounded px-3 py-2 text-slate-900" placeholder="Ton pseudo" />

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="grid gap-1 text-sm">
          Musiques / joueur
          <input v-model.number="config.maxMusicsPerPlayer" type="number" min="1" max="20" class="rounded px-3 py-2 text-slate-900" />
        </label>
        <label class="grid gap-1 text-sm">
          Durée sélection (s)
          <input v-model.number="config.selectionDuration" type="number" min="10" max="3600" class="rounded px-3 py-2 text-slate-900" />
        </label>
        <label class="grid gap-1 text-sm">
          Durée extrait (s)
          <input v-model.number="config.extractDuration" type="number" min="5" max="120" class="rounded px-3 py-2 text-slate-900" />
        </label>
        <label class="grid gap-1 text-sm">
          Durée vote (s)
          <input v-model.number="config.votingDuration" type="number" min="5" max="300" class="rounded px-3 py-2 text-slate-900" />
        </label>
        <label class="grid gap-1 text-sm">
          Joueurs max (optionnel)
          <input v-model.number="config.maxPlayers" type="number" min="2" max="100" class="rounded px-3 py-2 text-slate-900" />
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="config.showAnswers" type="checkbox" />
          Afficher les réponses après chaque vote
        </label>
      </div>

      <p v-if="store.error" class="text-sm text-red-400">{{ store.error }}</p>

      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white">Créer</button>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const router = useRouter();
const hostName = ref('');

const config = reactive({
  maxMusicsPerPlayer: 3,
  selectionDuration: 120,
  extractDuration: 20,
  votingDuration: 30,
  showAnswers: true,
  maxPlayers: null,
});

const submit = async () => {
  const payload = {
    ...config,
    maxPlayers: config.maxPlayers || null,
  };

  const { session } = await store.createSession(hostName.value, payload);
  store.connectSocket(session.code);
  router.push(`/game/${session.code}`);
};
</script>
