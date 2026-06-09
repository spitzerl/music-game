<template>
  <div class="min-h-screen p-6 max-w-5xl mx-auto flex flex-col justify-between opacity-0 animate-fade-in-up relative">
    <!-- Ambient glowing backgrounds -->
    <div class="glow-blob bg-purple-600 w-96 h-96 top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2"></div>
    <div class="glow-blob bg-cyan-600 w-96 h-96 bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2"></div>
    <div class="glow-blob bg-pink-600 w-80 h-80 top-1/2 left-2/3 -translate-x-1/2"></div>

    <!-- Header -->
    <header class="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Classement Final</h1>
        <p class="text-slate-400 text-sm">Session terminée ! Félicitations à tous les participants.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button @click="exportImage" class="glow-btn bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-cyan-600/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Partager les scores
        </button>
        <button v-if="isHost" @click="showPlayersModal = true" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all flex items-center gap-2">
          ⚙️ Gérer les joueurs
        </button>
        <button v-if="isHost" @click="replay" class="glow-btn-purple bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Rejouer
        </button>
      </div>
    </header>

    <!-- Podium & Leaderboard -->
    <main class="space-y-12 mb-8 relative z-10">
      <!-- Top 3 Podium (Only visible if at least 1 player) -->
      <section v-if="podium.length" class="flex flex-col sm:flex-row items-end justify-center gap-6 pt-20 pb-6 max-w-3xl mx-auto">
        <!-- 2nd Place -->
        <div v-if="podium[1]" class="order-2 sm:order-1 flex flex-col items-center w-full sm:w-48 group relative">
          <div class="podium-card relative w-full p-6 rounded-3xl flex flex-col items-center justify-between h-48 bg-gradient-to-b from-slate-500/15 via-slate-600/5 to-slate-950/10 border border-slate-500/35 shadow-lg text-center animate-grow-y transition-all duration-300 hover:translate-y-[-4px] hover:border-slate-400/50 hover:shadow-[0_0_30px_rgba(148,163,184,0.15)]" style="animation-delay: 0.15s;">
            <!-- Medal Circle -->
            <div class="absolute -top-10 w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 border-2 border-slate-350 flex items-center justify-center text-xl shadow-lg transition-transform duration-300 group-hover:scale-110">
              🥈
            </div>
            
            <div class="h-6"></div>
            
            <div>
              <p class="font-extrabold text-white truncate max-w-full text-base mb-1 tracking-wide">{{ podium[1].name }}</p>
              <p class="text-2xl font-black text-slate-300 font-mono mb-2">{{ podium[1].score }} <span class="text-xs font-normal text-slate-400">pts</span></p>
            </div>
            
            <!-- Quick stats -->
            <div class="flex gap-2 text-[10px] font-bold mt-auto">
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">🎯 {{ podium[1].correctGuesses || 0 }}</span>
              <span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">💜 {{ podium[1].votesReceived || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 1st Place -->
        <div v-if="podium[0]" class="order-1 sm:order-2 flex flex-col items-center w-full sm:w-52 transform -translate-y-4 group relative">
          <div class="podium-card podium-card-1 relative w-full p-6 rounded-3xl flex flex-col items-center justify-between h-56 bg-gradient-to-b from-yellow-500/15 via-amber-500/5 to-yellow-950/10 border border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)] text-center animate-grow-y transition-all duration-300 hover:translate-y-[-4px] hover:border-yellow-500/60 hover:shadow-[0_0_40px_rgba(234,179,8,0.25)]" style="animation-delay: 0.3s;">
            <!-- Crown & Medal -->
            <div class="absolute -top-16 flex flex-col items-center select-none">
              <!-- Crown SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-9 h-9 text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)] animate-float mb-0.5">
                <path d="M2 4 5 16h14l3-12-6 7-4-7-4 7-6-7Z"/>
                <path d="M3 20h18"/>
              </svg>
              <!-- Medal Circle -->
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-yellow-300 flex items-center justify-center text-2xl shadow-xl transition-transform duration-300 group-hover:scale-110">
                🥇
              </div>
            </div>
            
            <div class="h-10"></div>
            
            <div>
              <p class="font-extrabold text-white truncate max-w-full text-lg mb-1 tracking-wide">{{ podium[0].name }}</p>
              <p class="text-3xl font-black text-yellow-400 font-mono mb-2">{{ podium[0].score }} <span class="text-xs font-normal text-yellow-500/80">pts</span></p>
            </div>
            
            <!-- Quick stats -->
            <div class="flex gap-2 text-[10px] font-bold mt-auto">
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">🎯 {{ podium[0].correctGuesses || 0 }}</span>
              <span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">💜 {{ podium[0].votesReceived || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="podium[2]" class="order-3 flex flex-col items-center w-full sm:w-44 group relative">
          <div class="podium-card relative w-full p-5 rounded-3xl flex flex-col items-center justify-between h-42 bg-gradient-to-b from-amber-700/15 via-amber-800/5 to-amber-950/10 border border-amber-800/30 shadow-lg text-center animate-grow-y transition-all duration-300 hover:translate-y-[-4px] hover:border-amber-700/50 hover:shadow-[0_0_30px_rgba(180,83,9,0.15)]" style="animation-delay: 0s;">
            <!-- Medal Circle -->
            <div class="absolute -top-10 w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 border-2 border-amber-600 flex items-center justify-center text-lg shadow-lg transition-transform duration-300 group-hover:scale-110">
              🥉
            </div>
            
            <div class="h-4"></div>
            
            <div>
              <p class="font-extrabold text-white truncate max-w-full text-sm mb-1 tracking-wide">{{ podium[2].name }}</p>
              <p class="text-xl font-black text-amber-500 font-mono mb-2">{{ podium[2].score }} <span class="text-xs font-normal text-amber-650/80">pts</span></p>
            </div>
            
            <!-- Quick stats -->
            <div class="flex gap-1.5 text-[9px] font-bold mt-auto">
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">🎯 {{ podium[2].correctGuesses || 0 }}</span>
              <span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">💜 {{ podium[2].votesReceived || 0 }}</span>
            </div>
          </div>
        </div>
      </section>
      <!-- 2-column layout for Scores and Music History -->
      <div class="grid md:grid-cols-2 gap-8 items-start">
        <!-- Tableau des scores -->
        <section class="glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-xl">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📊</span> Tableau des scores
          </h2>
          
          <div class="space-y-3">
            <div v-for="(player, idx) in store.ranking" :key="player.id" 
              class="stagger-item flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/10 transition-all duration-300 px-2 rounded-xl" 
              :style="{ animationDelay: `${idx * 0.05}s` }">
              
              <div class="flex items-center gap-4">
                <!-- Rank number inside a badge -->
                <div :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm font-mono border shadow-sm',
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-300 border-slate-400/30' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-700/30' :
                  'bg-slate-900/60 text-slate-400 border-slate-850'
                ]">
                  #{{ idx + 1 }}
                </div>
                
                <!-- Initial Avatar -->
                <div :class="[
                  'w-10 h-10 rounded-full border flex items-center justify-center font-bold uppercase text-sm shadow-sm transition-colors duration-300',
                  idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/40 text-yellow-300' :
                  idx === 1 ? 'bg-gradient-to-br from-slate-400/20 to-slate-500/10 border-slate-400/40 text-slate-200' :
                  idx === 2 ? 'bg-gradient-to-br from-amber-700/20 to-amber-800/10 border-amber-700/40 text-amber-400' :
                  'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-800 text-slate-300'
                ]">
                  {{ player.name.substring(0, 2) }}
                </div>
                
                <!-- Name & Tags -->
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-base">{{ player.name }}</span>
                    <span v-if="player.is_bot" class="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-extrabold border border-cyan-500/30 uppercase tracking-wider">Bot</span>
                    <span v-if="player.is_observer" class="text-[9px] bg-slate-700/30 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Obs</span>
                  </div>
                  <!-- Compact stats under the name -->
                  <span class="text-xs text-slate-400 mt-0.5">
                    🎯 {{ player.correctGuesses || 0 }} correct • 💜 {{ player.votesReceived || 0 }} votes
                  </span>
                </div>
              </div>
              
              <!-- Total Score -->
              <div class="text-right flex items-center justify-between sm:justify-end gap-3 border-t border-slate-850 pt-3 sm:border-0 sm:pt-0">
                <span class="text-xs text-slate-500 sm:hidden">Score final :</span>
                <span class="font-black text-cyan-400 text-xl font-mono tracking-wide">
                  {{ player.score }} <span class="text-xs font-medium text-slate-400">pts</span>
                </span>
              </div>
            </div>
          </div>
        </section>
  
        <!-- Music Reveal History -->
        <section class="glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-xl">
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>🎵</span> Musiques de la partie
          </h2>
          
          <div class="space-y-3">
            <div v-for="music in store.musics" :key="music.id" 
              class="music-item-card flex items-center justify-between py-4 border-b border-slate-800/50 last:border-0 transition-all px-2 rounded-xl hover:bg-slate-900/10 group overflow-hidden">
              
              <div class="flex items-center gap-4 min-w-0 z-10">
                <!-- Pochette avec vinyle coulissant -->
                <div class="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                  <!-- Vinyle coulissant -->
                  <div class="vinyl-disc absolute w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg -z-10">
                    <div class="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center">
                      <div class="w-1 h-1 rounded-full bg-slate-950"></div>
                    </div>
                  </div>
                  
                  <!-- Cover Image -->
                  <img v-if="music.cover_url" :src="music.cover_url" 
                    class="relative w-14 h-14 rounded-xl object-cover shadow border border-slate-800/80 z-10 transition-transform duration-300 group-hover:scale-95" />
                  <div v-else class="relative w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-800 flex items-center justify-center text-slate-400 z-10 transition-transform duration-300 group-hover:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                      <path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a3 3 0 0 1-3.176-1.424l-3.32-5.32a3 3 0 0 1-.397-1.503V4.282A3 3 0 0 1 12.64 1.398l6.3-1.651a.75.75 0 0 1 1.012.904ZM12.64 2.898a1.5 1.5 0 0 0-.89 1.384v5.334a1.5 1.5 0 0 0 .198.752l3.32 5.32a1.5 1.5 0 0 0 .1588.712l1.32-.377a1.5 1.5 0 0 0 .1088-1.442V3.402l-5.3 1.388a.75.75 0 0 1-.298.058Z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div class="min-w-0 ml-1">
                  <p class="font-extrabold text-white text-base truncate">{{ music.title }}</p>
                  <p class="text-slate-400 text-sm truncate font-medium">{{ music.artist }}</p>
                </div>
              </div>
              
              <div class="text-right pl-4 z-10 flex flex-col items-end">
                <span class="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-0.5">Proposé par</span>
                <span class="font-extrabold text-sm text-yellow-400 bg-yellow-400/5 border border-yellow-400/10 px-2.5 py-1 rounded-lg inline-block truncate max-w-[120px]">{{ getPlayerName(music.player_id) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
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

    <!-- Export Modal -->
    <div v-if="showExportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="glass-panel max-w-lg w-full p-6 rounded-3xl border border-slate-800 shadow-2xl relative flex flex-col items-center">
        <button @click="showExportModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-all text-xl font-bold">
          ✕
        </button>
        
        <h3 class="text-xl font-bold text-white mb-2 flex items-center gap-2">
          📸 Résumé de la partie
        </h3>
        <p class="text-slate-400 text-xs text-center mb-4">
          Téléchargez cette carte pour la partager avec vos amis ou sur vos réseaux sociaux !
        </p>
        
        <!-- Image preview -->
        <div class="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg mb-6 relative group bg-slate-950">
          <img :src="exportImageUrl" alt="Résumé des scores" class="w-full h-full object-contain" />
          <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span class="text-white text-xs bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 font-medium">Appui long ou clic droit pour enregistrer</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3 w-full">
          <button @click="showExportModal = false" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl transition-all text-sm">
            Fermer
          </button>
          <a :href="exportImageUrl" :download="exportImageFilename" class="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all text-center flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Télécharger
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (!isTyping) {
      e.preventDefault();
      replay();
    }
  }
};

onMounted(async () => {
  if (route.path === '/test-export') {
    // Populate store with mock results
    store.ranking = [
      { id: '1', name: 'Lucas', score: 120, correctGuesses: 5, votesReceived: 2, is_bot: false },
      { id: '2', name: 'Sophie (Bot)', score: 95, correctGuesses: 4, votesReceived: 3, is_bot: true },
      { id: '3', name: 'Alex', score: 80, correctGuesses: 3, votesReceived: 4, is_bot: false },
      { id: '4', name: 'Thomas', score: 65, correctGuesses: 2, votesReceived: 1, is_bot: false },
      { id: '5', name: 'Emma', score: 40, correctGuesses: 1, votesReceived: 5, is_bot: false },
    ];
    store.players = [
      { id: '1', name: 'Lucas', is_connected: true, is_bot: false },
      { id: '2', name: 'Sophie (Bot)', is_connected: true, is_bot: true },
      { id: '3', name: 'Alex', is_connected: true, is_bot: false },
      { id: '4', name: 'Thomas', is_connected: true, is_bot: false },
      { id: '5', name: 'Emma', is_connected: true, is_bot: false },
    ];
    store.musics = [
      { id: 'm1', title: 'Get Lucky', artist: 'Daft Punk', proposer_id: '1', player_id: '1', cover_url: '' },
      { id: 'm2', title: 'Billie Jean', artist: 'Michael Jackson', proposer_id: '2', player_id: '2', cover_url: '' },
      { id: 'm3', title: 'Blinding Lights', artist: 'The Weeknd', proposer_id: '3', player_id: '3', cover_url: '' },
      { id: 'm4', title: 'Shape of You', artist: 'Ed Sheeran', proposer_id: '4', player_id: '4', cover_url: '' },
      { id: 'm5', title: 'Bohemian Rhapsody', artist: 'Queen', proposer_id: '5', player_id: '5', cover_url: '' },
    ];
    store.session = {
      code: 'TEST12',
      phase: 'results',
      host_name: 'Lucas'
    };
    return;
  }

  if (!store.player) {
    router.push(`/game/${route.params.code}`);
    return;
  }
  await store.loadResults(route.params.code);
  store.connectSocket(route.params.code);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
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
const showExportModal = ref(false);
const exportImageUrl = ref('');

const exportImageFilename = computed(() => {
  const code = store.session?.code || 'game';
  return `cekikilami_scores_${code}.png`;
});

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 1) + '…' : text;
};

const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle, strokeStyle, strokeWidth = 1) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
};

const drawVinyl = (ctx, cx, cy, r) => {
  // Outer vinyl disc (dark slate-950)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0f19'; // slate 950
  ctx.fill();

  // Outer border highlights
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#1e293b'; // slate 800
  ctx.lineWidth = 2;
  ctx.stroke();

  // Grooves (concentric lines)
  for (let i = 0.3; i < 0.9; i += 0.15) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * i, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Center label (cyan/purple gradient circle)
  const labelRadius = r * 0.35;
  const labelGrad = ctx.createLinearGradient(cx - labelRadius, cy - labelRadius, cx + labelRadius, cy + labelRadius);
  labelGrad.addColorStop(0, '#8b5cf6'); // purple
  labelGrad.addColorStop(1, '#06b6d4'); // cyan
  ctx.beginPath();
  ctx.arc(cx, cy, labelRadius, 0, Math.PI * 2);
  ctx.fillStyle = labelGrad;
  ctx.fill();

  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#020617'; // slate 950
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawGlowBlob = (ctx, x, y, r, color) => {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

const exportImage = () => {
  const ranking = store.ranking || [];
  const first = ranking[0];
  const second = ranking[1];
  const third = ranking[2];

  // We exclude the top 3 players from the list
  const remainingPlayersCount = Math.max(0, ranking.length - 3);
  // Panel height needs to fit remaining players (40px per row) or stats (which take about 240px)
  const panelHeight = Math.max(240, 85 + remainingPlayersCount * 40);
  const canvasHeight = 450 + panelHeight + 110;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // 1. Background radial gradient
  const bgGrad = ctx.createRadialGradient(400, canvasHeight / 2, 50, 400, canvasHeight / 2, Math.max(600, canvasHeight));
  bgGrad.addColorStop(0, '#100e2b'); // Indigo/purple 950 base
  bgGrad.addColorStop(0.6, '#080c18'); // slate 900 base
  bgGrad.addColorStop(1, '#020308'); // black/slate 950 base
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, canvasHeight);

  // Draw Glow Blobs to mirror the UI
  drawGlowBlob(ctx, 150, 150, 300, 'rgba(124, 58, 237, 0.08)'); // Purple glow top-left
  drawGlowBlob(ctx, 650, canvasHeight - 150, 300, 'rgba(6, 182, 212, 0.08)');  // Cyan glow bottom-right
  drawGlowBlob(ctx, 400, canvasHeight / 2, 250, 'rgba(219, 39, 119, 0.05)');  // Pink glow center

  // 2. Vinyl disc decorative background
  drawVinyl(ctx, 740, canvasHeight - 60, 150);

  // 3. Header title and info
  // Title "CÉKIKILAMI" with gradient
  const titleGrad = ctx.createLinearGradient(50, 0, 320, 0);
  titleGrad.addColorStop(0, '#06b6d4'); // cyan-500
  titleGrad.addColorStop(0.5, '#8b5cf6'); // purple-500
  titleGrad.addColorStop(1, '#ec4899'); // pink-500
  ctx.fillStyle = titleGrad;
  ctx.font = '900 38px Outfit, system-ui, -apple-system, sans-serif';
  ctx.fillText('CÉKIKILAMI', 50, 75);

  // Subtitle
  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`CLASSEMENT FINAL • SALON : ${store.session?.code || ''}`, 50, 110);

  // Date
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ctx.fillStyle = '#64748b'; // slate-500
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, 750, 110);
  ctx.textAlign = 'left'; // reset

  // Header separator line
  ctx.beginPath();
  ctx.moveTo(50, 135);
  ctx.lineTo(750, 135);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Draw Podium (Top 3)
  const drawPodiumColumn = (x, y, w, h, radius, fillGradStart, borderStyle, player, rankEmoji) => {
    if (!player) return;

    // 1. Column background with top rounded corners
    const colGrad = ctx.createLinearGradient(x, y, x, y + h);
    colGrad.addColorStop(0, fillGradStart);
    colGrad.addColorStop(1, 'rgba(15, 23, 42, 0.02)');
    drawRoundedRect(ctx, x, y, w, h, radius, colGrad, borderStyle, 1.5);

    // 2. Medal circle overlapping the top edge
    const medalRadius = rankEmoji === '🥇' ? 28 : rankEmoji === '🥈' ? 24 : 22;
    const medalY = y;
    
    // Draw medal outer glow/shadow
    ctx.beginPath();
    ctx.arc(x + w / 2, medalY, medalRadius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Draw medal circle
    const medalGrad = ctx.createLinearGradient(x + w / 2 - medalRadius, medalY - medalRadius, x + w / 2 + medalRadius, medalY + medalRadius);
    if (rankEmoji === '🥇') {
      medalGrad.addColorStop(0, '#fde047'); // yellow-300
      medalGrad.addColorStop(1, '#ca8a04'); // yellow-600
    } else if (rankEmoji === '🥈') {
      medalGrad.addColorStop(0, '#e2e8f0'); // slate-200
      medalGrad.addColorStop(1, '#64748b'); // slate-500
    } else {
      medalGrad.addColorStop(0, '#f97316'); // orange-500
      medalGrad.addColorStop(1, '#9a3412'); // orange-800
    }
    
    ctx.beginPath();
    ctx.arc(x + w / 2, medalY, medalRadius, 0, Math.PI * 2);
    ctx.fillStyle = medalGrad;
    ctx.fill();
    ctx.strokeStyle = rankEmoji === '🥇' ? '#facc15' : rankEmoji === '🥈' ? '#cbd5e1' : '#ea580c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Emoji inside Medal
    ctx.font = `${rankEmoji === '🥇' ? 20 : rankEmoji === '🥈' ? 18 : 16}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankEmoji, x + w / 2, medalY);
    ctx.textBaseline = 'alphabetic'; // reset

    // 3. Crown for 1st place
    if (rankEmoji === '🥇') {
      ctx.font = '28px system-ui';
      ctx.fillText('👑', x + w / 2, medalY - medalRadius - 8);
    }

    // 4. Player name inside the column (aligned from bottom y + h)
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 14px Outfit, system-ui, sans-serif';
    ctx.textAlign = 'center';
    let displayName = player.name;
    if (player.is_bot) displayName = truncateText(displayName, 10);
    else displayName = truncateText(displayName, 12);
    ctx.fillText(displayName, x + w / 2, y + h - 90);

    // 5. Score inside the column (aligned from bottom y + h)
    ctx.fillStyle = rankEmoji === '🥇' ? '#facc15' : rankEmoji === '🥈' ? '#cbd5e1' : '#f97316';
    ctx.font = '900 22px monospace';
    ctx.fillText(`${player.score}`, x + w / 2 - 10, y + h - 55);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('pts', x + w / 2 + (player.score.toString().length * 6) + 4, y + h - 55);

    // 6. Stats badges at the bottom of the column (aligned from bottom y + h)
    const statsY = y + h - 25;
    const correctVal = player.correctGuesses || 0;
    const votesVal = player.votesReceived || 0;

    // Badges layout (horizontal center align)
    const bW = 48;
    const bH = 18;
    const bRad = 9;
    const startX = x + w / 2 - bW - 3;
    
    // Correct Guesses badge
    drawRoundedRect(ctx, startX, statsY - 12, bW, bH, bRad, 'rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.2)', 1);
    ctx.fillStyle = '#34d399';
    ctx.font = '700 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🎯 ${correctVal}`, startX + bW / 2, statsY);

    // Votes Received badge
    const startX2 = x + w / 2 + 3;
    drawRoundedRect(ctx, startX2, statsY - 12, bW, bH, bRad, 'rgba(168, 85, 247, 0.08)', 'rgba(168, 85, 247, 0.2)', 1);
    ctx.fillStyle = '#c084fc';
    ctx.font = '700 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💜 ${votesVal}`, startX2 + bW / 2, statsY);
  };

  // Draw Podium
  ctx.textAlign = 'center';
  drawPodiumColumn(175, 260, 130, 160, 16, 'rgba(148, 163, 184, 0.15)', 'rgba(148, 163, 184, 0.25)', second, '🥈');
  drawPodiumColumn(325, 220, 150, 200, 20, 'rgba(234, 179, 8, 0.15)', 'rgba(234, 179, 8, 0.35)', first, '🥇');
  drawPodiumColumn(495, 290, 130, 130, 16, 'rgba(180, 83, 9, 0.12)', 'rgba(180, 83, 9, 0.22)', third, '🥉');
  ctx.textAlign = 'left'; // Reset

  // 5. Lower Content Panel: Left (Classment Table) & Right (Stats highlights)
  // Panel background
  drawRoundedRect(ctx, 50, 450, 700, panelHeight, 16, 'rgba(15, 23, 42, 0.45)', 'rgba(255, 255, 255, 0.06)', 1);

  // --- Left Column: Rankings ---
  ctx.fillStyle = '#94a3b8';
  ctx.font = '900 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('CLASSEMENT', 70, 485);

  let yOffset = 515;
  if (ranking.length <= 3) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Aucun autre joueur', 70, 515);
  } else {
    for (let i = 3; i < ranking.length; i++) {
      const p = ranking[i];
      
      // Draw Rank Badge container
      let badgeBg = 'rgba(15, 23, 42, 0.6)';
      let badgeStroke = 'rgba(255, 255, 255, 0.05)';
      let badgeText = '#94a3b8';
      drawRoundedRect(ctx, 70, yOffset - 16, 32, 22, 6, badgeBg, badgeStroke, 1);
      
      // Rank text inside badge
      ctx.fillStyle = badgeText;
      ctx.font = '900 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, 86, yOffset - 1);

      // Draw Avatar circle
      ctx.beginPath();
      ctx.arc(122, yOffset - 5, 12, 0, Math.PI * 2);
      let avBg = 'rgba(30, 41, 59, 0.8)';
      let avStroke = 'rgba(255, 255, 255, 0.08)';
      let avText = '#cbd5e1';
      ctx.fillStyle = avBg;
      ctx.fill();
      ctx.strokeStyle = avStroke;
      ctx.stroke();

      // Avatar initials
      ctx.fillStyle = avText;
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.name.substring(0, 2).toUpperCase(), 122, yOffset - 5);
      ctx.textBaseline = 'alphabetic'; // reset

      // Player Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px Outfit, system-ui, sans-serif';
      ctx.textAlign = 'left';
      let displayName = p.name;
      if (p.is_bot) displayName += ' (Bot)';
      ctx.fillText(truncateText(displayName, 14), 146, yOffset);

      // Player Score
      ctx.fillStyle = '#22d3ee';
      ctx.font = '800 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.score} pts`, 370, yOffset);
      ctx.textAlign = 'left'; // reset

      // Separator line
      ctx.beginPath();
      ctx.moveTo(70, yOffset + 12);
      ctx.lineTo(370, yOffset + 12);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();

      yOffset += 40;
    }
  }

  // Vertical Divider
  ctx.beginPath();
  ctx.moveTo(400, 470);
  ctx.lineTo(400, 450 + panelHeight - 25);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- Right Column: Stats ---
  ctx.fillStyle = '#94a3b8';
  ctx.font = '900 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('STATISTIQUES', 430, 485);

  const totalTracks = store.musics.length;

  let bestDetective = null;
  let maxCorrect = 0;
  ranking.forEach(p => {
    if (p.correctGuesses > maxCorrect) {
      maxCorrect = p.correctGuesses;
      bestDetective = p.name;
    }
  });

  let mostSuspected = null;
  let maxVotes = 0;
  ranking.forEach(p => {
    if (p.votesReceived > maxVotes) {
      maxVotes = p.votesReceived;
      mostSuspected = p.name;
    }
  });

  let statsY = 525;

  // Helper to draw a single stat item
  const drawStatItem = (icon, title, value, valColor) => {
    // Icon
    ctx.font = '22px system-ui';
    ctx.fillText(icon, 430, statsY - 2);
    
    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(title.toUpperCase(), 468, statsY - 10);
    
    // Value
    ctx.fillStyle = valColor || '#ffffff';
    ctx.font = '800 14px Outfit, system-ui, sans-serif';
    ctx.fillText(value, 468, statsY + 8);
    
    statsY += 52;
  };

  // Stat 1: Total tracks
  drawStatItem('🎵', 'Morceaux joués', `${totalTracks} titres proposés`, '#cbd5e1');

  // Stat 2: Best detective
  if (bestDetective) {
    drawStatItem('🎯', 'Meilleur détective', `${bestDetective} (${maxCorrect} correct${maxCorrect > 1 ? 's' : ''})`, '#34d399');
  } else {
    drawStatItem('🎯', 'Meilleur détective', 'Aucune bonne réponse', '#64748b');
  }

  // Stat 3: Most suspected
  if (mostSuspected) {
    drawStatItem('💜', 'Le plus suspecté', `${mostSuspected} (${maxVotes} vote${maxVotes > 1 ? 's' : ''} reçu${maxVotes > 1 ? 's' : ''})`, '#c084fc');
  } else {
    drawStatItem('😈', 'Le plus suspecté', 'Aucun vote reçu', '#64748b');
  }

  // 6. Footer branding
  ctx.beginPath();
  ctx.moveTo(50, 450 + panelHeight + 25);
  ctx.lineTo(750, 450 + panelHeight + 25);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('CÉKIKILAMI • JEU DE MUSIQUE EN LIGNE', 50, 450 + panelHeight + 65);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '500 12px monospace';
  ctx.fillText('cekikilami.lucasspitzer.fr', 750, 450 + panelHeight + 65);
  ctx.textAlign = 'left';

  exportImageUrl.value = canvas.toDataURL('image/png');
  showExportModal.value = true;
};

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

<style scoped>
/* Glowing background blobs */
.glow-blob {
  filter: blur(120px);
  pointer-events: none;
  position: absolute;
  border-radius: 9999px;
  opacity: 0.12;
  z-index: -10;
}

/* Glass panel glow animation */
.podium-card {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.podium-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
}

.podium-card-1:hover {
  box-shadow: 0 20px 40px -15px rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.4);
}

/* Music vinyl rotation effect */
.music-item-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.music-item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
}

.vinyl-disc {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0px) rotate(0deg);
  opacity: 0;
}
.music-item-card:hover .vinyl-disc {
  transform: translateX(24px) rotate(180deg);
  opacity: 1;
}

/* Staggered slide up items */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
</style>
