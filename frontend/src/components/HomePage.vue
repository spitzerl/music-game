<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
    <!-- Decorative background blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-30 animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600 rounded-full filter blur-[128px] opacity-30 animate-pulse" style="animation-delay: 2s;"></div>

    <div class="relative z-10 w-full max-w-4xl">
      <!-- Title & Branding -->
      <div class="text-center mb-12 animate-float">
        <h1 class="text-6xl font-extrabold tracking-tight mb-3">
          <span class="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">
            Devine Beat
          </span>
        </h1>
        <p class="text-lg text-slate-400 font-medium max-w-md mx-auto">
          Le jeu de blind test social interactif. Devinez qui a proposé chaque morceau et devenez le maître du rythme.
        </p>
      </div>

      <!-- Action Cards Grid -->
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Create Room Card -->
        <div class="glass-panel p-8 rounded-2xl shadow-xl flex flex-col justify-between hover:border-cyan-500/40 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 opacity-0 animate-fade-in-up">
          <div>
            <div class="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Créer un Salon</h2>
            <p class="text-slate-400 text-sm mb-6">
              Devenez l'hôte de la partie, configurez les règles (nombre de musiques, timers, révélations) et invitez vos amis.
            </p>
          </div>

          <form @submit.prevent="onCreate" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Votre Pseudo</label>
              <input v-model="createName" required class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" placeholder="Pseudo de l'hôte" />
            </div>
            <button class="w-full glow-btn bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg transition-all">
              Lancer le Salon
            </button>
          </form>
        </div>

        <!-- Join Room Card -->
        <div class="glass-panel p-8 rounded-2xl shadow-xl flex flex-col justify-between hover:border-purple-500/40 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 opacity-0 animate-fade-in-up" style="animation-delay: 0.15s;">
          <div>
            <div class="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Rejoindre un Salon</h2>
            <p class="text-slate-400 text-sm mb-6">
              Entrez le code de session à 6 caractères généré par l'hôte pour vous connecter instantanément.
            </p>
          </div>

          <form @submit.prevent="onJoin" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Code</label>
                <input v-model="joinCode" required maxlength="6" class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-center font-mono uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="ABCDEF" />
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Votre Pseudo</label>
                <input v-model="joinName" required class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="Votre pseudo" />
              </div>
            </div>
            <button class="w-full glow-btn-purple bg-purple-500 hover:bg-purple-400 text-white font-bold py-2.5 rounded-lg transition-all">
              Rejoindre la Partie
            </button>
          </form>
        </div>
      </div>
      
      <p v-if="error" class="mt-6 text-center text-rose-400 text-sm font-semibold bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const router = useRouter();

const createName = ref('');
const joinCode = ref('');
const joinName = ref('');
const error = ref(null);

const onCreate = async () => {
  error.value = null;
  try {
    const { session } = await store.createSession(createName.value);
    store.connectSocket(session.code);
    router.push(`/game/${session.code}`);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Erreur de création";
  }
};

const onJoin = async () => {
  error.value = null;
  const code = joinCode.value.trim().toUpperCase();
  try {
    await store.joinSession(code, joinName.value);
    store.connectSocket(code);
    router.push(`/game/${code}`);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Impossible de rejoindre";
  }
};
</script>
