<template>
  <div class="page-container animate-fade-in-up opacity-0">

    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Sélection des Musiques</h1>
        <p class="text-sm text-[var(--text-secondary)] mt-0.5">Proposez vos morceaux avant la fin du temps imparti.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Timer -->
        <div :class="['timer-display', remainingTime < 20 ? 'urgent' : '']" role="timer" :aria-label="`Temps restant : ${formatTime(remainingTime)}`">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
          <span>{{ formatTime(remainingTime) }}</span>
        </div>

        <!-- Host skip -->
        <button v-if="isHost && allPlayersReady" @click="forceStartVoting"
          class="btn btn-primary text-sm"
          title="Tous les joueurs ont choisi — passer au vote maintenant">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"/></svg>
          Passer au vote
        </button>
      </div>
    </header>

    <!-- Mobile tabs -->
    <div class="flex md:hidden seg-control mb-5" role="tablist" aria-label="Navigation sélection">
      <button id="tab-sel" role="tab" :aria-selected="activeTab==='selection'" aria-controls="panel-sel"
        @click="activeTab='selection'"
        :class="['seg-btn', activeTab==='selection' ? 'active-accent' : '']">
        Ma Sélection ({{ store.musics.length }}/{{ store.session?.max_musics_per_player || 2 }})
      </button>
      <button id="tab-track" role="tab" :aria-selected="activeTab==='tracker'" aria-controls="panel-tracker"
        @click="activeTab='tracker'"
        :class="['seg-btn', activeTab==='tracker' ? 'active-accent' : '']">
        Suivi des Dépôts
      </button>
    </div>

    <div class="flex flex-col gap-6">

      <!-- Search + Submitted (hidden on mobile when tracker tab active) -->
      <div id="panel-sel" role="tabpanel" aria-labelledby="tab-sel"
        :class="['grid lg:grid-cols-2 gap-6', activeTab==='tracker' ? 'hidden md:grid' : 'grid']">

        <!-- Music search -->
        <section class="glass-panel p-5 rounded-2xl border border-[var(--border-strong)] flex flex-col gap-4" aria-labelledby="search-heading">
          <h2 id="search-heading" class="section-header">
            <svg class="w-5 h-5 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
            Rechercher une musique
          </h2>

          <div v-if="store.musics.length < (store.session?.max_musics_per_player || 2)">
            <!-- Search input -->
            <div class="relative mb-4">
              <label for="music-search" class="sr-only">Rechercher un artiste ou un titre</label>
              <input id="music-search" v-model="searchQuery"
                class="form-input pl-11"
                placeholder="Artiste, titre…"
                autocomplete="off" autocorrect="off" spellcheck="false"
              />
              <svg v-if="!isSearching" class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
              <svg v-else class="animate-spin w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            </div>

            <p v-if="searchError" role="alert" class="text-sm text-rose-400 mb-3">{{ searchError }}</p>

            <!-- Results list -->
            <TransitionGroup name="list" tag="ul" v-if="tracks.length"
              class="max-h-64 overflow-y-auto space-y-1 rounded-xl p-1" style="background:rgba(15,23,42,.5)"
              aria-label="Résultats de recherche">
              <li v-for="track in tracks" :key="track.id"
                class="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border)]">
                <div class="flex items-center gap-3 min-w-0">
                  <img v-if="track.cover" :src="track.cover" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" :alt="`Pochette ${track.title}`" loading="lazy" />
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-sm text-white">{{ track.title }}</p>
                    <p class="truncate text-xs text-[var(--text-secondary)]">{{ track.artist }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" @click="togglePreview(track)"
                    :aria-label="previewUrl===track.preview && isPlaying ? 'Mettre en pause' : `Écouter ${track.title}`"
                    class="btn btn-ghost btn-icon" style="width:36px;height:36px">
                    <svg v-if="previewUrl===track.preview && isPlaying" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4" aria-hidden="true"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd"/></svg>
                  </button>
                  <button type="button" @click="chooseTrack(track)"
                    :aria-label="`Choisir ${track.title}`"
                    class="btn btn-primary text-xs px-3" style="min-height:36px">
                    Choisir
                  </button>
                </div>
              </li>
            </TransitionGroup>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl" style="background:var(--surface-raised);border:1px solid var(--border)">
            <svg class="w-8 h-8 text-emerald-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg>
            <p class="text-sm font-semibold text-emerald-400">Maximum atteint !</p>
            <p class="text-xs text-[var(--text-secondary)] mt-1">Vous avez soumis {{ store.session?.max_musics_per_player || 2 }} musique(s). Attendez la fin du chrono.</p>
          </div>
        </section>

        <!-- Submitted musics -->
        <section class="glass-panel p-5 rounded-2xl border border-[var(--border-strong)] flex flex-col" aria-labelledby="submitted-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="submitted-heading" class="section-header">
              <svg class="w-5 h-5 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2.25 2.25L15 9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></svg>
              Vos musiques
            </h2>
            <!-- Progress bar -->
            <div class="flex items-center gap-2">
              <div class="flex gap-1" aria-hidden="true">
                <div v-for="i in (store.session?.max_musics_per_player || 2)" :key="i"
                  :class="['w-4 h-4 rounded-full border-2 transition-all duration-500', i <= store.musics.length ? 'border-indigo-500 bg-indigo-500' : 'border-[var(--border-strong)] bg-transparent']">
                </div>
              </div>
              <span class="text-xs font-bold text-[var(--text-secondary)]" aria-label="`${store.musics.length} musiques soumises sur ${store.session?.max_musics_per_player || 2}`">
                {{ store.musics.length }}/{{ store.session?.max_musics_per_player || 2 }}
              </span>
            </div>
          </div>

          <TransitionGroup name="list" tag="div" class="flex-1 space-y-1">
            <div v-for="music in store.musics" :key="music.id" class="player-row">
              <div class="flex items-center gap-3 min-w-0">
                <img v-if="music.cover_url" :src="music.cover_url" class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[var(--border)]" :alt="`Pochette ${music.title}`" loading="lazy" />
                <div class="min-w-0">
                  <p class="font-bold text-white text-sm truncate">{{ music.title }}</p>
                  <p class="text-xs text-[var(--text-secondary)] truncate">{{ music.artist }}</p>
                </div>
              </div>
              <button @click="deleteSubmittedMusic(music.id)"
                :aria-label="`Supprimer ${music.title}`"
                class="btn btn-icon" style="width:36px;height:36px;background:var(--clr-danger-dim);border:1px solid rgba(244,63,94,.25);color:#fda4af;border-radius:var(--r-md)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
              </button>
            </div>
          </TransitionGroup>

          <p v-if="!store.musics.length" class="text-xs text-[var(--text-muted)] italic mt-4 text-center">
            Aucune musique ajoutée pour le moment.
          </p>
        </section>
      </div>

      <!-- Submission tracker -->
      <section id="panel-tracker" role="tabpanel" aria-labelledby="tab-track"
        :class="['glass-panel p-5 rounded-2xl border border-[var(--border-strong)]', activeTab==='tracker' ? 'block' : 'hidden md:block']"
        aria-labelledby="tracker-heading">
        <h2 id="tracker-heading" class="section-header mb-4">
          <svg class="w-5 h-5 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>
          Suivi des dépôts
        </h2>
        <div class="flex flex-wrap gap-3" aria-live="polite">
          <div v-for="player in store.players" :key="player.id"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors"
            style="background:var(--surface-raised);border:1px solid var(--border-strong)">
            <span :class="['status-dot', player.is_connected ? 'online' : 'offline']"></span>
            <img v-if="player.avatar_seed"
              :src="`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${player.avatar_seed}&backgroundColor=6366f1,8b5cf6,06b6d4,f43f5e,10b981`"
              class="w-6 h-6 rounded-full border border-[var(--border)]" :alt="`Avatar de ${player.name}`" loading="lazy" />
            <span class="font-bold text-sm text-[var(--text-secondary)]">{{ player.name }}</span>
            <span v-if="player.is_bot" class="badge badge-bot">Bot</span>
            <span v-if="player.name === store.session?.host_name" class="badge badge-host">Hôte</span>
            <span class="text-xs font-mono font-bold pl-2 border-l border-[var(--border)]"
              :class="getPlayerMusicCount(player.id) >= (store.session?.max_musics_per_player || 2) ? 'text-emerald-400' : 'text-[var(--text-secondary)]'">
              {{ getPlayerMusicCount(player.id) }}/{{ store.session?.max_musics_per_player || 2 }}
            </span>
            <svg v-if="getPlayerMusicCount(player.id) >= (store.session?.max_musics_per_player || 2)"
              class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor" aria-label="Prêt" role="img">
              <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
            </svg>
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

const route  = useRoute();
const router = useRouter();
const store  = useGameStore();

const searchQuery  = ref('');
const tracks       = ref([]);
const isSearching  = ref(false);
const searchError  = ref('');
const activeTab    = ref('selection');
const remainingTime = ref(0);
let timerInterval  = null;

const previewUrl = ref(null);
const isPlaying  = ref(false);
let audioObject  = null;

const formatTime = (secs) => {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getPlayerMusicCount = (id) => store.musicCounts ? (store.musicCounts[id] || 0) : 0;

const updateTimer = () => {
  if (store.session?.timer_ends_at) {
    remainingTime.value = Math.max(0, Math.round((new Date(store.session.timer_ends_at).getTime() - Date.now()) / 1000));
  } else {
    remainingTime.value = 0;
  }
};

const isHost = computed(() => store.player && store.session && store.player.name === store.session.host_name);

const allPlayersReady = computed(() => {
  if (!store.players || !store.musicCounts || !store.session) return false;
  const max = store.session.max_musics_per_player || 2;
  const active = store.players.filter(p => p.is_connected && !p.is_observer);
  return active.length > 0 && active.every(p => (store.musicCounts[p.id] || 0) >= max);
});

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault(); forceStartVoting();
  }
};

onMounted(async () => {
  if (!store.player) { router.push(`/game/${route.params.code}`); return; }
  await store.loadSession(route.params.code);
  store.connectSocket(route.params.code);
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  window.addEventListener('keydown', handleKeyDown);
  searchTracks();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (audioObject) audioObject.pause();
  window.removeEventListener('keydown', handleKeyDown);
});

watch(() => store.session?.phase, (p) => {
  if (p === 'voting')  router.push(`/game/${route.params.code}/voting`);
  if (p === 'results') router.push(`/game/${route.params.code}/results`);
  if (p === 'waiting') router.push(`/game/${route.params.code}`);
});

const searchTracks = async () => {
  isSearching.value = true; searchError.value = '';
  try {
    const { data } = await apiService.searchDeezer(searchQuery.value.trim() || '');
    tracks.value = data?.tracks || [];
    if (!tracks.value.length) searchError.value = 'Aucun résultat trouvé.';
  } catch {
    tracks.value = []; searchError.value = 'Recherche indisponible.';
  } finally { isSearching.value = false; }
};

let searchTimeout = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchTracks, 300);
});

const togglePreview = (track) => {
  if (audioObject && previewUrl.value === track.preview) {
    if (isPlaying.value) { audioObject.pause(); isPlaying.value = false; }
    else { audioObject.play(); isPlaying.value = true; }
  } else {
    if (audioObject) audioObject.pause();
    previewUrl.value = track.preview;
    audioObject = new Audio(track.preview);
    audioObject.volume = 0.5;
    audioObject.play();
    isPlaying.value = true;
    audioObject.addEventListener('ended', () => { isPlaying.value = false; previewUrl.value = null; });
  }
};

const chooseTrack = async (track) => {
  if (!store.player?.id) return;
  if (audioObject) { audioObject.pause(); isPlaying.value = false; }
  try {
    await apiService.addMusic(route.params.code, {
      playerId: String(store.player.id),
      title: track.title, artist: track.artist,
      deezerPreviewUrl: track.preview, coverUrl: track.cover,
    });
    await store.loadSession(route.params.code);
    searchQuery.value = '';
  } catch (err) { console.error('Failed to add music:', err); }
};

const deleteSubmittedMusic = async (id) => { try { await store.deleteMusic(id); } catch {} };
const forceStartVoting = async () => { if (isHost.value) try { await store.startVoting(); } catch {} };
const promotePlayer = async (id) => { if (confirm("Désigner ce joueur comme Hôte ?")) try { await store.promotePlayer(id); } catch {} };
const kickPlayer    = async (id) => { if (confirm("Exclure ce joueur ?"))             try { await store.kickPlayer(id); }    catch {} };
</script>
