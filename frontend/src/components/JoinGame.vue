<template>
  <form class="flex gap-2" @submit.prevent="submit">
    <input v-model="code" required maxlength="6" class="rounded px-3 py-2 uppercase" placeholder="Code" />
    <input v-model="name" required class="rounded px-3 py-2" placeholder="Pseudo" />
    <button class="rounded bg-indigo-500 px-4 py-2 font-semibold text-white">Rejoindre</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const router = useRouter();
const store = useGameStore();
const code = ref('');
const name = ref('');

const submit = async () => {
  const sessionCode = code.value.trim().toUpperCase();
  await store.joinSession(sessionCode, name.value);
  store.connectSocket(sessionCode);
  router.push(`/game/${sessionCode}`);
};
</script>
