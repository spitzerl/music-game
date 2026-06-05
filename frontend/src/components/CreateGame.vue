<template>
  <section class="mx-auto max-w-xl p-6">
    <h2 class="mb-4 text-2xl font-bold">Créer une partie</h2>
    <form class="flex gap-3" @submit.prevent="submit">
      <input v-model="hostName" required class="w-full rounded px-3 py-2" placeholder="Ton pseudo" />
      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white">Créer</button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const router = useRouter();
const hostName = ref('');

const submit = async () => {
  const { session } = await store.createSession(hostName.value);
  store.connectSocket(session.code);
  router.push(`/game/${session.code}`);
};
</script>
