<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center p-4">
    <div class="text-slate-400 font-semibold flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
      Chargement...
    </div>
  </div>

  <!-- Join Form if not in session -->
  <div v-else-if="!store.player || store.player.session_id !== store.session?.id" class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600 rounded-full filter blur-[128px] opacity-20 animate-pulse" style="animation-delay: 2s;"></div>
    
    <div class="relative z-10 glass-panel p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
      <h2 class="text-3xl font-extrabold text-center mb-6">
        <span class="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Rejoindre la partie {{ route.params.code }}</span>
      </h2>
      <form @submit.prevent="joinDirectly" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Votre Pseudo</label>
          <input v-model="directPseudo" required class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-all" placeholder="Entrez un pseudo" />
        </div>
        <button class="w-full glow-btn bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg transition-all">
          Rejoindre
        </button>
      </form>
      <p v-if="errorMsg" class="mt-4 text-center text-rose-400 text-sm font-semibold bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
        {{ errorMsg }}
      </p>
    </div>
  </div>

  <!-- Waiting Room Content -->
  <div v-else class="min-h-screen p-6 max-w-7xl mx-auto flex flex-col justify-start gap-4 opacity-0 animate-fade-in-up">
    <!-- Header -->
    <header class="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Salon de Jeu</h1>
        <p class="text-slate-400 text-sm flex items-center gap-2 flex-wrap mt-1">
          <span>Lien d'invitation :</span>
          <span @click="copyCode" class="font-mono text-cyan-400 font-bold text-lg bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 cursor-pointer hover:bg-slate-800 hover:border-cyan-500/50 transition-all inline-flex items-center gap-1.5 active:scale-95" title="Cliquez pour copier le lien">
            {{ route.params.code }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 opacity-60 hover:opacity-100">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5h.75m-.75 3h.75m-.75 3h.75m-.75 3h.75M19.5 7.5h-12c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125h12c.621 0 1.125-.504 1.125-1.125V8.625c0-.621-.504-1.125-1.125-1.125Z" />
            </svg>
          </span>
          <span v-if="copied" class="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-fade-in">Lien copié !</span>
          <span v-else class="text-[11px] text-slate-500 italic">(cliquez pour copier le lien)</span>
        </p>
      </div>
      <div class="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span class="text-sm font-medium text-slate-300">Phase d'attente</span>
      </div>
    </header>

    <div class="grid md:grid-cols-3 gap-8 mb-8 items-start">
      <!-- Left Column: Config Panel -->
      <section class="glass-panel p-6 rounded-2xl md:col-span-1 border border-slate-800 transition-all duration-300">
        <div class="flex justify-between items-center mb-4 md:mb-6 cursor-pointer md:cursor-default" @click="toggleConfigMobile">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-cyan-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Paramètres du jeu
          </h2>
          <!-- Collapse/Expand arrow: only visible on mobile -->
          <button class="md:hidden text-slate-400 focus:outline-none p-1" aria-label="Toggle Configuration">
            <svg v-if="showConfigOnMobile" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        <div :class="['transition-all duration-300 md:block space-y-5', showConfigOnMobile ? 'block opacity-100' : 'hidden']">
          <!-- Max Musics per Player -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Musiques par joueur</label>
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner">
              <button 
                v-for="val in [1, 2, 3, 5]" 
                :key="val" 
                @click="isHost && (config.maxMusicsPerPlayer = val) && saveConfig()"
                :disabled="!isHost"
                type="button"
                :class="['flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', config.maxMusicsPerPlayer === val ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30']"
              >
                {{ val }}
              </button>
            </div>
          </div>

          <!-- Selection Duration -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Durée de sélection</label>
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner flex-wrap">
              <button 
                v-for="opt in [{ v: 15, l: '15s' }, { v: 30, l: '30s' }, { v: 60, l: '1m' }, { v: 120, l: '2m' }, { v: 180, l: '3m' }]" 
                :key="opt.v" 
                @click="isHost && (config.selectionDuration = opt.v) && saveConfig()"
                :disabled="!isHost"
                type="button"
                :class="['flex-1 min-w-[45px] py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', config.selectionDuration === opt.v ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30']"
              >
                {{ opt.l }}
              </button>
            </div>
          </div>

          <!-- Extract Duration -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Durée d'extrait</label>
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner">
              <button 
                v-for="val in [10, 15, 20, 30]" 
                :key="val" 
                @click="isHost && (config.extractDuration = val) && saveConfig()"
                :disabled="!isHost"
                type="button"
                :class="['flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', config.extractDuration === val ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30']"
              >
                {{ val }}s
              </button>
            </div>
          </div>

          <!-- Voting Duration -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Temps de vote</label>
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner flex-wrap">
              <button 
                v-for="val in [5, 10, 15, 20, 30, 45]" 
                :key="val" 
                @click="isHost && (config.votingDuration = val) && saveConfig()"
                :disabled="!isHost"
                type="button"
                :class="['flex-1 min-w-[35px] py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', config.votingDuration === val ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30']"
              >
                {{ val }}s
              </button>
            </div>
          </div>

          <!-- Show Answers -->
          <div class="flex items-center justify-between py-2 border-y border-slate-800/80">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider pr-4">Révéler les réponses</span>
            <label class="switch-container">
              <input 
                type="checkbox" 
                v-model="config.showAnswers" 
                :disabled="!isHost" 
                @change="saveConfig" 
                class="switch-input" 
              />
              <span class="switch-track">
                <span class="switch-thumb"></span>
              </span>
            </label>
          </div>

          <!-- Auto Advance -->
          <div class="flex items-center justify-between py-2 border-b border-slate-800/80">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider pr-4">Enchaîner les manches</span>
            <label class="switch-container">
              <input 
                type="checkbox" 
                v-model="config.autoAdvance" 
                :disabled="!isHost" 
                @change="saveConfig" 
                class="switch-input" 
              />
              <span class="switch-track">
                <span class="switch-thumb"></span>
              </span>
            </label>
          </div>

          <!-- Show Vote Count -->
          <div class="flex items-center justify-between py-2 border-b border-slate-800/80">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider pr-4">Afficher le nombre de votes</span>
            <label class="switch-container">
              <input 
                type="checkbox" 
                v-model="config.showVoteCount" 
                :disabled="!isHost" 
                @change="saveConfig" 
                class="switch-input" 
              />
              <span class="switch-track">
                <span class="switch-thumb"></span>
              </span>
            </label>
          </div>

          <!-- Max Players -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Limite de joueurs</label>
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner">
              <button 
                v-for="val in [4, 8, 12, 16]" 
                :key="val" 
                @click="isHost && (config.maxPlayers = val) && saveConfig()"
                :disabled="!isHost"
                type="button"
                :class="['flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', config.maxPlayers === val ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30']"
              >
                {{ val }}
              </button>
            </div>
          </div>
          
          <p v-if="!isHost" class="text-center text-xs text-slate-500 mt-4 italic">
            Seul l'hôte peut modifier ces règles.
          </p>
        </div>
      </section>

      <!-- Right Column: Players List -->
      <section class="glass-panel p-6 rounded-2xl md:col-span-2 border border-slate-800 flex flex-col justify-between min-h-[450px]">
        <div>
          <div class="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-purple-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A3.318 3.318 0 0 1 11.682 22H8.318A3.318 3.318 0 0 1 5 19.237v-.109c0-1.113.285-2.16.786-3.07M15 19.128v-.109a3.318 3.318 0 0 0-3.318-3.318H8.318a3.318 3.318 0 0 0-3.318 3.318v.109M15 19.128v.109c0 .248-.027.493-.08.73M5 19.128v.109c.053.237.08.482.08.73m0 0A3.318 3.318 0 0 1 8.318 22h3.364a3.318 3.318 0 0 0 3.238-2.673M5 19.128v-.109c0-.218.02-.435.06-.645m10.28 0a3.3 3.3 0 0 0-.06-.645M19.5 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.75 6a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm13.5 9a2.25 2.25 0 0 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" />
              </svg>
              Joueurs connectés
            </h2>
            <span class="text-xs bg-slate-900 px-3 py-1 rounded-full text-slate-400 font-bold border border-slate-800">
              {{ store.players.length }} / {{ store.session?.max_players || 8 }}
            </span>
          </div>

          <!-- Players List with TransitionGroup -->
          <TransitionGroup
            name="list"
            tag="div"
            class="space-y-2"
          >
            <div v-for="player in store.players" :key="player.id" :class="['py-3.5 flex items-center justify-between border-b border-slate-800/50 last:border-0 hover:bg-slate-900/10 transition-all duration-300 px-2 rounded-xl', !player.is_connected ? 'opacity-40' : '']">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Status circle indicator -->
                <span :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', player.is_connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500']"></span>
                <span class="font-bold text-white truncate">{{ player.name }}</span>
                <span v-if="player.is_bot" class="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">Bot</span>
                <span v-if="player.name === store.session?.host_name" class="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">Hôte</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs font-semibold text-slate-500">
                  <span v-if="!player.is_connected">Déconnecté</span>
                  <span v-else class="text-emerald-400">Prêt</span>
                </div>
                <!-- Host Actions -->
                <div v-if="isHost && player.id !== store.player?.id" class="flex gap-1.5 border-l border-slate-800 pl-3">
                  <!-- Promote to Host -->
                  <button v-if="!player.is_bot" @click="promotePlayer(player.id)" title="Promouvoir Hôte" class="p-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v11.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <!-- Kick Player -->
                  <button @click="kickPlayer(player.id)" title="Kick du salon" class="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Action Area -->
        <div class="mt-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row gap-4">
          <!-- Host Controls -->
          <div v-if="isHost" class="flex flex-col sm:flex-row gap-4 w-full">
            <button @click="addBot" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-cyan-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Ajouter un Bot
            </button>
            <button @click="startSelection" class="flex-1 glow-btn bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Lancer la Sélection
            </button>
          </div>

          <!-- Non-Host Status Message -->
          <div v-else class="w-full text-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-slate-400 italic text-sm">
            En attente du lancement par l'hôte ({{ store.session?.host_name }})...
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const directPseudo = ref('');
const errorMsg = ref(null);
const isLoading = ref(true);

const showConfigOnMobile = ref(false);
const toggleConfigMobile = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    showConfigOnMobile.value = !showConfigOnMobile.value;
  }
};

const copied = ref(false);
const copyCode = async () => {
  try {
    const inviteLink = `${window.location.origin}/game/${route.params.code}`;
    await navigator.clipboard.writeText(inviteLink);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy link:", err);
  }
};

// Form configuration state reactively mapped to session config
const config = reactive({
  maxMusicsPerPlayer: 2,
  selectionDuration: 120,
  extractDuration: 20,
  votingDuration: 30,
  showAnswers: true,
  maxPlayers: 8,
  autoAdvance: false,
  showVoteCount: true
});

const isHost = computed(() => {
  return store.player && store.session && store.player.name === store.session.host_name;
});

const loadAndSyncConfig = async () => {
  await store.loadSession(route.params.code);
  if (store.session) {
    config.maxMusicsPerPlayer = store.session.max_musics_per_player;
    config.selectionDuration = store.session.selection_duration;
    config.extractDuration = store.session.extract_duration;
    config.votingDuration = store.session.voting_duration;
    config.showAnswers = store.session.show_answers;
    config.maxPlayers = store.session.max_players;
    config.autoAdvance = store.session.auto_advance;
    config.showVoteCount = store.session.show_vote_count;
  }
};

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (!isTyping) {
      e.preventDefault();
      startSelection();
    }
  }
};

onMounted(async () => {
  try {
    await loadAndSyncConfig();
    if (store.player && store.player.session_id === store.session?.id) {
      store.connectSocket(route.params.code);
    }
    window.addEventListener('keydown', handleKeyDown);
  } catch (err) {
    console.error("Failed to load waiting room session:", err);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// Watch for changes in session from socket to keep config updated for non-hosts
watch(() => store.session, (newSession) => {
  if (newSession) {
    config.maxMusicsPerPlayer = newSession.max_musics_per_player;
    config.selectionDuration = newSession.selection_duration;
    config.extractDuration = newSession.extract_duration;
    config.votingDuration = newSession.voting_duration;
    config.showAnswers = newSession.show_answers;
    config.maxPlayers = newSession.max_players;
    config.autoAdvance = newSession.auto_advance;
    config.showVoteCount = newSession.show_vote_count;
    
    // Redirect if phase is already started
    if (newSession.phase === 'selection') {
      router.push(`/game/${route.params.code}/selection`);
    } else if (newSession.phase === 'voting') {
      router.push(`/game/${route.params.code}/voting`);
    } else if (newSession.phase === 'results') {
      router.push(`/game/${route.params.code}/results`);
    }
  }
}, { deep: true });

const joinDirectly = async () => {
  errorMsg.value = null;
  try {
    const code = route.params.code.toUpperCase();
    await store.joinSession(code, directPseudo.value);
    store.connectSocket(code);
    await loadAndSyncConfig();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || "Erreur de connexion";
  }
};

const saveConfig = async () => {
  if (!isHost.value) return;
  try {
    await store.updateConfig({
      maxMusicsPerPlayer: config.maxMusicsPerPlayer,
      selectionDuration: config.selectionDuration,
      extractDuration: config.extractDuration,
      votingDuration: config.votingDuration,
      showAnswers: config.showAnswers,
      maxPlayers: config.maxPlayers,
      autoAdvance: config.autoAdvance,
      showVoteCount: config.showVoteCount
    });
  } catch (err) {
    console.error("Failed to update config:", err);
  }
};

const addBot = async () => {
  if (!isHost.value) return;
  try {
    await store.addBot();
  } catch (err) {
    console.error("Failed to add bot:", err);
  }
};

const startSelection = async () => {
  if (!isHost.value) return;
  try {
    await store.startSelection();
  } catch (err) {
    console.error("Failed to start selection:", err);
  }
};

const promotePlayer = async (targetId) => {
  if (!isHost.value) return;
  if (confirm("Voulez-vous vraiment désigner ce joueur comme Hôte ? Vous perdrez vos droits d'administration.")) {
    try {
      await store.promotePlayer(targetId);
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
