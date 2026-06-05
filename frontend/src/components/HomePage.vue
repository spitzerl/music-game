<template>
  <section class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6">
    <h1 class="text-4xl font-bold">Music Game</h1>
    <div class="flex gap-4">
      <router-link to="/create" class="rounded bg-cyan-500 px-4 py-2 font-semibold text-white">Créer une partie</router-link>
      <JoinGame />
    </div>
  </section>
</template>

<script setup>
import JoinGame from './JoinGame.vue';
</script>
