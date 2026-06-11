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
          <i class="fa-regular fa-clock text-[18px]"></i>
          <span>{{ formatTime(remainingTime) }}</span>
        </div>

        <!-- Host skip -->
        <button v-if="isHost && allPlayersReady" @click="forceStartVoting"
          class="btn btn-primary text-sm"
          title="Tous les joueurs ont choisi — passer au vote maintenant">
          <i class="fa-solid fa-forward text-[14px]"></i>
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

    <div class="flex flex-col gap-6 min-w-0 w-full">

      <!-- Search + Submitted (hidden on mobile when tracker tab active) -->
      <div id="panel-sel" role="tabpanel" aria-labelledby="tab-sel"
        :class="['grid lg:grid-cols-2 gap-6 min-w-0 w-full', activeTab==='tracker' ? 'hidden md:grid' : 'grid']">

        <!-- Music search -->
        <section class="glass-panel p-4 sm:p-5 rounded-2xl border border-[var(--border-strong)] flex flex-col gap-4 min-w-0" aria-labelledby="search-heading">
          <h2 id="search-heading" class="section-header">
            <i class="fa-solid fa-magnifying-glass text-[18px] icon"></i>
            Rechercher une musique
          </h2>

          <div v-if="store.musics.length < (store.session?.max_musics_per_player || 2)" class="min-w-0">
            <!-- Search input -->
            <div class="relative mb-4">
              <label for="music-search" class="sr-only">Rechercher un artiste ou un titre</label>
              <input id="music-search" v-model="searchQuery"
                class="form-input"
                style="padding-left: 2.75rem"
                placeholder="Artiste, titre…"
                autocomplete="off" autocorrect="off" spellcheck="false"
              />
              <i v-if="!isSearching" class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none text-[16px]"></i>
              <i v-else class="fa-solid fa-circle-notch fa-spin absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none text-[16px]"></i>
            </div>

            <p v-if="searchError" role="alert" class="text-sm text-rose-400 mb-3">{{ searchError }}</p>

            <!-- Results list -->
            <TransitionGroup name="list" tag="ul" v-if="tracks.length"
              class="max-h-64 overflow-y-auto space-y-1 rounded-xl p-1 min-w-0" style="background:rgba(15,23,42,.5)"
              aria-label="Résultats de recherche">
              <li v-for="track in tracks" :key="track.id"
                class="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border)] min-w-0">
                <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                  <img v-if="track.cover" :src="track.cover" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" :alt="`Pochette ${track.title}`" loading="lazy" />
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-xs sm:text-sm text-white">{{ track.title }}</p>
                    <p class="truncate text-[10px] sm:text-xs text-[var(--text-secondary)]">{{ track.artist }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <button type="button" @click="togglePreview(track)"
                    :aria-label="previewUrl===track.preview && isPlaying ? 'Mettre en pause' : `Écouter ${track.title}`"
                    class="btn btn-ghost btn-sm btn-icon">
                    <i v-if="previewUrl===track.preview && isPlaying" class="fa-solid fa-pause text-[14px]"></i>
                    <i v-else class="fa-solid fa-play text-[14px]"></i>
                  </button>
                  <button type="button" @click="chooseTrack(track)"
                    :aria-label="`Choisir ${track.title}`"
                    class="btn btn-primary btn-sm px-2.5 sm:px-3">
                    Choisir
                  </button>
                </div>
              </li>
            </TransitionGroup>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl" style="background:var(--surface-raised);border:1px solid var(--border)">
            <i class="fa-regular fa-circle-check text-[32px] text-emerald-400 mb-2"></i>
            <p class="text-sm font-semibold text-emerald-400">Maximum atteint !</p>
            <p class="text-xs text-[var(--text-secondary)] mt-1">Vous avez soumis {{ store.session?.max_musics_per_player || 2 }} musique(s). Attendez la fin du chrono.</p>
          </div>
        </section>

        <!-- Submitted musics -->
        <section class="glass-panel p-4 sm:p-5 rounded-2xl border border-[var(--border-strong)] flex flex-col min-w-0" aria-labelledby="submitted-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="submitted-heading" class="section-header">
              <i class="fa-solid fa-music text-[18px] icon"></i>
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

          <TransitionGroup name="list" tag="div" class="flex-1 space-y-1 min-w-0">
            <div v-for="music in store.musics" :key="music.id" class="player-row min-w-0">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <img v-if="music.cover_url" :src="music.cover_url" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0 border border-[var(--border)]" :alt="`Pochette ${music.title}`" loading="lazy" />
                <div class="min-w-0">
                  <p class="font-bold text-white text-xs sm:text-sm truncate">{{ music.title }}</p>
                  <p class="text-[10px] sm:text-xs text-[var(--text-secondary)] truncate">{{ music.artist }}</p>
                </div>
              </div>
              <button @click="deleteSubmittedMusic(music.id)"
                :aria-label="`Supprimer ${music.title}`"
                class="btn btn-danger btn-sm btn-icon flex-shrink-0">
                <i class="fa-solid fa-trash-can text-[14px]"></i>
              </button>
            </div>
          </TransitionGroup>

          <p v-if="!store.musics.length" class="text-xs text-[var(--text-muted)] italic mt-4 text-center">
            Aucune musique ajoutée pour le moment.
          </p>
        </section>
      </div>

      <!-- Submission tracker -->
      <section id="panel-tracker" role="tabpanel" aria-labelledby="tracker-heading"
        :class="['glass-panel p-5 rounded-2xl border border-[var(--border-strong)]', activeTab==='tracker' ? 'block' : 'hidden md:block']">
        <h2 id="tracker-heading" class="section-header mb-4">
          <i class="fa-solid fa-users text-[18px] icon"></i>
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
            <i v-if="getPlayerMusicCount(player.id) >= (store.session?.max_musics_per_player || 2)"
              class="fa-solid fa-check text-[14px] text-emerald-400" aria-label="Prêt" role="img"></i>
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
    remainingTime.value = Math.max(0, Math.round((new Date(store.session.timer_ends_at).getTime() - store.correctedNow()) / 1000));
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
