<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto flex flex-col justify-start gap-4 opacity-0 animate-fade-in-up">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold text-white">Sélection des Musiques</h1>
        <p class="text-slate-400 text-sm">Proposez vos morceaux avant la fin du temps imparti.</p>
      </div>

      <!-- Timer Indicator -->
      <div class="flex items-center gap-3">
        <div :class="['flex items-center gap-3 px-5 py-2.5 rounded-xl border font-bold text-lg transition-all duration-300', remainingTime < 20 ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-cyan-400']">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="font-mono">{{ formatTime(remainingTime) }}</span>
        </div>
        <!-- Host skip button: visible only when all non-bot players are ready -->
        <button
          v-if="isHost && allPlayersReady"
          @click="forceStartVoting"
          class="glow-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          title="Tous les joueurs ont choisi — passer au vote maintenant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
          </svg>
          Passer au vote
        </button>
      </div>
    </header>

    <!-- Mobile Tabs Navigation -->
    <div class="flex md:hidden bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 mb-6">
      <button 
        @click="activeTab = 'selection'" 
        :class="['flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all text-center', activeTab === 'selection' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white']"
      >
        Ma Sélection ({{ store.musics.length }} / {{ store.session?.max_musics_per_player || 2 }})
      </button>
      <button 
        @click="activeTab = 'tracker'" 
        :class="['flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all text-center', activeTab === 'tracker' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white']"
      >
        Suivi des Dépôts
      </button>
    </div>

    <div class="flex flex-col gap-8 items-stretch mb-8">
      <!-- Left & Center Columns: Music search and added songs -->
      <div :class="['grid lg:grid-cols-2 gap-8', activeTab === 'selection' ? 'block' : 'hidden md:grid']">
        <!-- Left Column: Music search -->
        <section class="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
          <div class="flex-1">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-cyan-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Ajouter vos musiques
              </h2>
            </div>

            <!-- Add music form (hidden if limit reached) -->
            <div v-if="store.musics.length < (store.session?.max_musics_per_player || 2)">
              <form class="space-y-4" @submit.prevent>
                <div class="flex gap-2">
                  <div class="relative w-full">
                    <input
                      v-model="searchQuery"
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      placeholder="Rechercher un artiste, titre..."
                    />
                    <svg v-if="!isSearching" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 absolute left-3 top-3 text-slate-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <svg v-else class="animate-spin w-5 h-5 absolute left-3 top-3 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>

                <!-- Search Results -->
                <p v-if="searchError" class="text-sm text-rose-400 mt-2">{{ searchError }}</p>
                
                <TransitionGroup
                  name="list"
                  tag="ul"
                  v-if="tracks.length"
                  class="max-h-60 overflow-y-auto space-y-1 rounded-lg bg-slate-950/20 p-2"
                >
                  <li
                    v-for="track in tracks"
                    :key="track.id"
                    class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-800/40 last:border-0 hover:bg-slate-900/10 px-2 rounded-lg transition-all"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <img v-if="track.cover" :src="track.cover" class="w-10 h-10 rounded object-cover" />
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-sm text-white">{{ track.title }}</p>
                        <p class="truncate text-xs text-slate-400">{{ track.artist }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <!-- Audio Preview Toggle -->
                      <button type="button" @click="togglePreview(track)" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
                        <svg v-if="previewUrl === track.preview && isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <!-- Choose Button -->
                      <button type="button" class="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-bold transition-all" @click="chooseTrack(track)">
                        Choisir
                      </button>
                    </div>
                  </li>
                </TransitionGroup>
              </form>
            </div>
   
            <div v-else class="bg-slate-900/60 border border-slate-800 p-6 rounded-xl text-center text-slate-400 italic">
              Vous avez proposé le nombre maximum de musiques ({{ store.session?.max_musics_per_player || 2 }}). Attendez la fin du chrono !
            </div>
          </div>
        </section>
 
        <!-- Right Column: Submitted Musics List with Delete option -->
        <section class="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white">Vos musiques soumises</h3>
            <span class="text-xs bg-slate-900 px-3 py-1 rounded-full text-slate-300 font-bold border border-slate-800">
              Soumis : {{ store.musics.length }} / {{ store.session?.max_musics_per_player || 2 }}
            </span>
          </div>
          <TransitionGroup
            name="list"
            tag="div"
            class="space-y-2 flex-1"
          >
            <div v-for="music in store.musics" :key="music.id" class="py-3 flex items-center justify-between border-b border-slate-800/50 last:border-0 hover:bg-slate-900/10 transition-all px-2 rounded-xl">
              <div class="flex items-center gap-3 min-w-0">
                <img v-if="music.cover_url" :src="music.cover_url" class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-800" />
                <div class="min-w-0">
                  <p class="font-bold text-white text-sm truncate">{{ music.title }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ music.artist }}</p>
                </div>
              </div>
              <button @click="deleteSubmittedMusic(music.id)" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-lg border border-rose-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </TransitionGroup>
          <p v-if="!store.musics.length" class="text-xs text-slate-500 italic mt-4">Aucune musique ajoutée pour le moment.</p>
        </section>
      </div>

      <!-- Bottom Row: Submission Tracker -->
      <section :class="['glass-panel p-5 rounded-2xl border border-slate-800', activeTab === 'tracker' ? 'block' : 'hidden md:block']">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-purple-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A3.318 3.318 0 0 1 11.682 22H8.318A3.318 3.318 0 0 1 5 19.237v-.109c0-1.113.285-2.16.786-3.07M15 19.128v-.109a3.318 3.318 0 0 0-3.318-3.318H8.318a3.318 3.318 0 0 0-3.318 3.318v.109M15 19.128v.109c0 .248-.027.493-.08.73M5 19.128v.109c.053.237.08.482.08.73m0 0A3.318 3.318 0 0 1 8.318 22h3.364a3.318 3.318 0 0 0 3.238-2.673M5 19.128v-.109c0-.218.02-.435.06-.645m10.28 0a3.3 3.3 0 0 0-.06-.645M19.5 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.75 6a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm13.5 9a2.25 2.25 0 0 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" />
            </svg>
            Suivi des dépôts
          </h2>
        </div>

        <div class="flex flex-wrap gap-3">
          <div v-for="player in store.players" :key="player.id" class="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 hover:bg-slate-800/60 transition-colors">
            <div class="flex items-center gap-2">
              <span :class="['w-2 h-2 rounded-full flex-shrink-0', player.is_connected ? 'bg-emerald-500' : 'bg-rose-500']"></span>
              <span class="font-bold text-sm text-slate-300">{{ player.name }}</span>
              <span v-if="player.is_bot" class="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1 py-0.5 rounded font-extrabold uppercase tracking-wider">Bot</span>
              <span v-if="player.name === store.session?.host_name" class="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 py-0.5 rounded font-extrabold uppercase tracking-wider">Hôte</span>
            </div>
            
            <div class="flex items-center gap-2 border-l border-slate-700 pl-3">
              <span class="text-xs font-mono font-bold text-slate-400">
                {{ getPlayerMusicCount(player.id) }}/{{ store.session?.max_musics_per_player || 2 }}
              </span>
              <span v-if="getPlayerMusicCount(player.id) >= (store.session?.max_musics_per_player || 2)" class="text-emerald-400 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" /></svg>
              </span>
            </div>
            
            <!-- Host Actions -->
            <div v-if="isHost && player.id !== store.player?.id" class="flex gap-1.5 border-l border-slate-700 pl-3 ml-1">
              <button v-if="!player.is_bot" @click="promotePlayer(player.id)" title="Promouvoir Hôte" class="text-yellow-500 hover:text-yellow-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" clip-rule="evenodd" /></svg>
              </button>
              <button @click="kickPlayer(player.id)" title="Kick du salon" class="text-rose-500 hover:text-rose-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiService from '../services/apiService';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const searchQuery = ref('');
const tracks = ref([]);
const isSearching = ref(false);
const searchError = ref('');
const activeTab = ref('selection');

// Timer Management
const remainingTime = ref(0);
let timerInterval = null;

// Audio Preview management
const previewUrl = ref(null);
const isPlaying = ref(false);
let audioObject = null;

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getPlayerMusicCount = (playerId) => {
  return store.musicCounts ? (store.musicCounts[playerId] || 0) : 0;
};

const updateTimer = () => {
  if (store.session?.timer_ends_at) {
    const end = new Date(store.session.timer_ends_at).getTime();
    const diff = Math.max(0, Math.round((end - Date.now()) / 1000));
    remainingTime.value = diff;
  } else {
    remainingTime.value = 0;
  }
};

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (!isTyping) {
      e.preventDefault();
      forceStartVoting();
    }
  }
};

onMounted(async () => {
  if (!store.player) {
    router.push(`/game/${route.params.code}`);
    return;
  }
  await store.loadSession(route.params.code);
  store.connectSocket(route.params.code);
  
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  window.addEventListener('keydown', handleKeyDown);

  // Load initial random/top tracks
  searchTracks();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (audioObject) {
    audioObject.pause();
  }
  window.removeEventListener('keydown', handleKeyDown);
});

// Watch for phase changes to redirect
watch(() => store.session?.phase, (newPhase) => {
  if (newPhase === 'voting') {
    router.push(`/game/${route.params.code}/voting`);
  } else if (newPhase === 'results') {
    router.push(`/game/${route.params.code}/results`);
  } else if (newPhase === 'waiting') {
    router.push(`/game/${route.params.code}`);
  }
});

const searchTracks = async () => {
  isSearching.value = true;
  searchError.value = '';
  try {
    const { data } = await apiService.searchDeezer(searchQuery.value.trim() || '');
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

let searchTimeout = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTracks();
  }, 300);
});

const togglePreview = (track) => {
  if (audioObject && previewUrl.value === track.preview) {
    if (isPlaying.value) {
      audioObject.pause();
      isPlaying.value = false;
    } else {
      audioObject.play();
      isPlaying.value = true;
    }
  } else {
    if (audioObject) {
      audioObject.pause();
    }
    previewUrl.value = track.preview;
    audioObject = new Audio(track.preview);
    audioObject.volume = 0.5;
    audioObject.play();
    isPlaying.value = true;

    audioObject.addEventListener('ended', () => {
      isPlaying.value = false;
      previewUrl.value = null;
    });
  }
};

const chooseTrack = async (track) => {
  if (!store.player?.id) return;
  try {
    if (audioObject) {
      audioObject.pause();
      isPlaying.value = false;
    }
    
    await apiService.addMusic(route.params.code, {
      playerId: String(store.player.id),
      title: track.title,
      artist: track.artist,
      deezerPreviewUrl: track.preview,
      coverUrl: track.cover,
    });

    await store.loadSession(route.params.code);
    searchQuery.value = ''; // This will trigger the watcher and reload the chart tracks
  } catch (err) {
    console.error("Failed to add music:", err);
  }
};

const deleteSubmittedMusic = async (musicId) => {
  try {
    await store.deleteMusic(musicId);
  } catch (err) {
    console.error("Failed to delete music:", err);
  }
};

const isHost = computed(() => {
  return store.player && store.session && store.player.name === store.session.host_name;
});

// True when every connected, non-observer player has submitted the required number of musics
const allPlayersReady = computed(() => {
  if (!store.players || !store.musicCounts || !store.session) return false;
  const maxMusics = store.session.max_musics_per_player || 2;
  const activePlayers = store.players.filter(p => p.is_connected && !p.is_observer);
  return activePlayers.length > 0 && activePlayers.every(p => (store.musicCounts[p.id] || 0) >= maxMusics);
});

const forceStartVoting = async () => {
  if (!isHost.value) return;
  try {
    await store.startVoting();
  } catch (err) {
    console.error('Failed to force start voting:', err);
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
