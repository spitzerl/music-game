<template>
  <div class="min-h-screen p-6 max-w-5xl mx-auto flex flex-col justify-between opacity-0 animate-fade-in-up">
    <!-- Header -->
    <header class="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Classement Final</h1>
        <p class="text-slate-400 text-sm">Session terminée ! Félicitations à tous les participants.</p>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="isHost" @click="showPlayersModal = true" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all flex items-center gap-2">
          ⚙️ Gérer les joueurs
        </button>
        <div v-if="isHost" class="flex gap-3">
          <button @click="replay" class="glow-btn-purple bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Rejouer
          </button>
        </div>
      </div>
    </header>

    <!-- Podium & Leaderboard -->
    <main class="space-y-12 mb-8">
      <!-- Top 3 Podium (Only visible if at least 1 player) -->
      <section v-if="podium.length" class="flex flex-col sm:flex-row items-end justify-center gap-6 pt-12 pb-4">
        <!-- 2nd Place -->
        <div v-if="podium[1]" class="order-2 sm:order-1 flex flex-col items-center w-full sm:w-44">
          <div class="relative glass-panel w-full p-5 rounded-t-2xl border-b-0 border-slate-700/80 flex flex-col items-center justify-end h-40 shadow-lg text-center animate-grow-y" style="animation-delay: 0.15s;">
            <span class="absolute -top-6 w-10 h-10 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 flex items-center justify-center font-black text-sm">2</span>
            <p class="font-extrabold text-white truncate max-w-full text-base mb-1">{{ podium[1].name }}</p>
            <p class="text-xl font-black text-slate-300 font-mono">{{ podium[1].score }} <span class="text-xs font-normal">pts</span></p>
          </div>
          <div class="w-full h-8 bg-slate-800/40 rounded-b-2xl border border-slate-700/60 border-t-0"></div>
        </div>

        <!-- 1st Place -->
        <div v-if="podium[0]" class="order-1 sm:order-2 flex flex-col items-center w-full sm:w-48 transform -translate-y-4">
          <div class="relative bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 w-full p-6 rounded-t-3xl border-b-0 flex flex-col items-center justify-end h-48 shadow-2xl text-center animate-grow-y" style="animation-delay: 0.3s;">
            <!-- Crown icon -->
            <div class="absolute -top-8 text-yellow-400 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <p class="font-black text-yellow-400 truncate max-w-full text-lg mb-1">{{ podium[0].name }}</p>
            <p class="text-3xl font-black text-yellow-400 font-mono">{{ podium[0].score }} <span class="text-sm font-normal">pts</span></p>
          </div>
          <div class="w-full h-10 bg-gradient-to-b from-yellow-500/10 to-amber-500/5 rounded-b-3xl border border-yellow-500/20 border-t-0"></div>
        </div>

        <!-- 3rd Place -->
        <div v-if="podium[2]" class="order-3 flex flex-col items-center w-full sm:w-40">
          <div class="relative glass-panel w-full p-4 rounded-t-2xl border-b-0 border-slate-700/80 flex flex-col items-center justify-end h-32 shadow-lg text-center animate-grow-y" style="animation-delay: 0s;">
            <span class="absolute -top-6 w-10 h-10 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-black text-sm">3</span>
            <p class="font-extrabold text-white truncate max-w-full text-sm mb-1">{{ podium[2].name }}</p>
            <p class="text-lg font-black text-amber-600 font-mono">{{ podium[2].score }} <span class="text-xs font-normal">pts</span></p>
          </div>
          <div class="w-full h-6 bg-slate-800/40 rounded-b-2xl border border-slate-700/60 border-t-0"></div>
        </div>
      </section>

      <!-- Detailed Scoreboard Table -->
      <section class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-6">Tableau des scores</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400">
                <th class="py-3 px-4 font-semibold uppercase tracking-wider">Rang</th>
                <th class="py-3 px-4 font-semibold uppercase tracking-wider">Joueur</th>
                <th class="py-3 px-4 font-semibold uppercase tracking-wider text-center">Bonnes Réponses</th>
                <th class="py-3 px-4 font-semibold uppercase tracking-wider text-center">Votes Reçus</th>
                <th class="py-3 px-4 font-semibold uppercase tracking-wider text-right">Score Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(player, idx) in store.ranking" :key="player.id" class="border-b border-slate-800/40 hover:bg-slate-900/20">
                <td class="py-4 px-4 font-mono font-bold">{{ idx + 1 }}</td>
                <td class="py-4 px-4 font-bold flex items-center gap-2">
                  <span class="text-white">{{ player.name }}</span>
                  <span v-if="player.is_bot" class="text-[9px] bg-cyan-500/20 text-cyan-400 px-1 py-0.5 rounded font-extrabold border border-cyan-500/30">Bot</span>
                  <span v-if="player.is_observer" class="text-[9px] bg-slate-700/35 text-slate-400 px-1 py-0.5 rounded font-bold">Obs</span>
                </td>
                <td class="py-4 px-4 text-center font-mono text-emerald-400">{{ player.correctGuesses || 0 }} (x2)</td>
                <td class="py-4 px-4 text-center font-mono text-purple-400">{{ player.votesReceived || 0 }} (x1)</td>
                <td class="py-4 px-4 text-right font-mono font-extrabold text-cyan-400 text-base">{{ player.score }} pts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Music Reveal History -->
      <section class="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-6">Toutes les musiques proposées</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div v-for="music in store.musics" :key="music.id" class="glass-card p-4 rounded-xl border border-slate-850 flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-800 flex items-center justify-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a3 3 0 0 1-3.176-1.424l-3.32-5.32a3 3 0 0 1-.397-1.503V4.282A3 3 0 0 1 12.64 1.398l6.3-1.651a.75.75 0 0 1 1.012.904ZM12.64 2.898a1.5 1.5 0 0 0-.89 1.384v5.334a1.5 1.5 0 0 0 .198.752l3.32 5.32a1.5 1.5 0 0 0 1.588.712l1.32-.377a1.5 1.5 0 0 0 1.088-1.442V3.402l-5.3 1.388a.75.75 0 0 1-.298.058Z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="font-bold text-white text-sm truncate">{{ music.title }}</p>
                <p class="text-slate-400 text-xs truncate">{{ music.artist }}</p>
              </div>
            </div>
            
            <div class="text-right pl-4">
              <span class="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Proposé par</span>
              <span class="font-extrabold text-sm text-yellow-400">{{ getPlayerName(music.player_id) }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Manage Players Modal -->
    <div v-if="showPlayersModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
        <button @click="showPlayersModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-all text-xl font-bold">
          ✕
        </button>
        
        <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
          ⚙️ Gérer les participants
        </h3>
        
        <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
          <div v-for="p in store.players" :key="p.id" class="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-850">
            <div class="flex items-center gap-3">
              <span :class="['w-2 h-2 rounded-full', p.is_connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500']"></span>
              <span class="font-bold text-slate-200 text-sm">{{ p.name }}</span>
              <span v-if="p.is_bot" class="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Bot</span>
              <span v-if="p.name === store.session?.host_name" class="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Hôte</span>
            </div>
            
            <div class="flex gap-2">
              <!-- Promote to Host -->
              <button v-if="!p.is_bot && p.id !== store.player?.id" @click="promotePlayer(p.id)" title="Promouvoir Hôte" class="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v11.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <!-- Kick Player -->
              <button v-if="p.id !== store.player?.id" @click="kickPlayer(p.id)" title="Kick du salon" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const isHost = computed(() => {
  return store.player && store.session && store.player.name === store.session.host_name;
});

const podium = computed(() => {
  // Take top 3 players from ranking
  return store.ranking.slice(0, 3);
});

const getPlayerName = (id) => {
  const p = store.players.find(player => player.id === id);
  return p ? p.name : 'Inconnu';
};

onMounted(async () => {
  if (!store.player) {
    router.push(`/game/${route.params.code}`);
    return;
  }
  await store.loadResults(route.params.code);
  store.connectSocket(route.params.code);
});

// Watch for phase changes to redirect back to waiting room when session is reset
watch(() => store.session?.phase, (newPhase) => {
  if (newPhase === 'waiting') {
    router.push(`/game/${route.params.code}`);
  }
});

const replay = async () => {
  if (!isHost.value) return;
  try {
    await store.resetSession();
  } catch (err) {
    console.error("Failed to reset session:", err);
  }
};

const showPlayersModal = ref(false);

const promotePlayer = async (targetId) => {
  if (!isHost.value) return;
  if (confirm("Voulez-vous vraiment désigner ce joueur comme Hôte ? Vous perdrez vos droits d'administration.")) {
    try {
      await store.promotePlayer(targetId);
      showPlayersModal.value = false;
    } catch (err) {
      console.error("Failed to promote player:", err);
    }
  }
};

const kickPlayer = async (targetId) => {
  if (!isHost.value) return;
  if (confirm("Voulez-vous vraiment exclure ce joueur de la partie ?")) {
    try {
      await store.kickPlayer(targetId);
    } catch (err) {
      console.error("Failed to kick player:", err);
    }
  }
};
</script>
