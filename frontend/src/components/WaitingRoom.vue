<template>
  <section class="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <header class="rounded bg-slate-900 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-2xl font-bold">Partie {{ route.params.code }}</h2>
        <span class="rounded bg-slate-800 px-3 py-1 text-sm uppercase">{{ phaseLabel }}</span>
      </div>

      <div class="mt-3 h-2 w-full rounded bg-slate-700">
        <div class="h-2 rounded bg-cyan-500 transition-all" :style="{ width: `${phaseProgress}%` }"></div>
      </div>

      <p v-if="timerLabel" class="mt-4 text-3xl font-bold" :class="remainingSeconds < 10 ? 'text-red-500' : 'text-emerald-400'">
        {{ timerLabel }}: {{ remainingSeconds }}s
      </p>

      <p class="mt-2 text-sm text-slate-300">
        Config: {{ store.session?.max_musics_per_player }} musiques/joueur · sélection {{ store.session?.selection_duration }}s ·
        extrait {{ store.session?.extract_duration }}s · vote {{ store.session?.voting_duration }}s
      </p>
    </header>

    <p v-if="store.error" class="rounded border border-red-500/40 bg-red-900/30 p-3 text-red-300">{{ store.error }}</p>

    <section class="rounded bg-slate-900 p-4">
      <h3 class="mb-3 text-lg font-semibold">Joueurs</h3>
      <ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="player in store.players" :key="player.id" class="rounded bg-slate-800 p-3">
          <div class="flex items-center justify-between gap-2">
            <span>{{ player.name }}</span>
            <span class="text-xs text-slate-300">
              {{ player.connected ? 'en ligne' : 'hors ligne' }}
            </span>
          </div>
          <p class="text-xs text-slate-300">
            {{ player.musicCount || 0 }}/{{ store.session?.max_musics_per_player }} musiques ·
            score {{ player.finalScore || 0 }}
          </p>
          <p class="text-xs text-slate-400">
            {{ player.can_vote ? 'Votant' : 'Observateur' }}
          </p>
        </li>
      </ul>
    </section>

    <section v-if="store.phase === 'waiting'" class="grid gap-4 rounded bg-slate-900 p-4">
      <h3 class="text-lg font-semibold">Salle d'attente</h3>

      <template v-if="store.isHost">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm">
            Musiques / joueur
            <input v-model.number="config.maxMusicsPerPlayer" type="number" min="1" max="20" class="rounded px-3 py-2 text-slate-900" />
          </label>
          <label class="grid gap-1 text-sm">
            Durée sélection (s)
            <input v-model.number="config.selectionDuration" type="number" min="10" max="3600" class="rounded px-3 py-2 text-slate-900" />
          </label>
          <label class="grid gap-1 text-sm">
            Durée extrait (s)
            <input v-model.number="config.extractDuration" type="number" min="5" max="120" class="rounded px-3 py-2 text-slate-900" />
          </label>
          <label class="grid gap-1 text-sm">
            Durée vote (s)
            <input v-model.number="config.votingDuration" type="number" min="5" max="300" class="rounded px-3 py-2 text-slate-900" />
          </label>
          <label class="grid gap-1 text-sm">
            Joueurs max (optionnel)
            <input v-model.number="config.maxPlayers" type="number" min="2" max="100" class="rounded px-3 py-2 text-slate-900" />
          </label>
          <label class="mt-6 flex items-center gap-2 text-sm">
            <input v-model="config.showAnswers" type="checkbox" />
            Afficher les réponses
          </label>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="rounded bg-slate-700 px-4 py-2" @click="saveConfig">Enregistrer config</button>
          <button class="rounded bg-emerald-600 px-4 py-2 font-semibold" @click="store.startSelection()">Commencer</button>
        </div>

        <div class="flex flex-wrap gap-2">
          <input v-model="botName" class="rounded px-3 py-2 text-slate-900" placeholder="Nom du bot" />
          <button class="rounded bg-indigo-600 px-4 py-2" @click="addBot">Ajouter un bot</button>
        </div>
      </template>

      <p v-else>En attente du démarrage par l'hôte…</p>
    </section>

    <section v-if="store.phase === 'selection'" class="grid gap-4 rounded bg-slate-900 p-4">
      <h3 class="text-lg font-semibold">Sélection des musiques</h3>

      <p>
        Progression: <strong>{{ store.myMusicCount }}/{{ store.maxMusicsPerPlayer }}</strong>
      </p>

      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          class="w-full rounded px-3 py-2 text-slate-900"
          placeholder="Rechercher un morceau Deezer"
          @keyup.enter.prevent="searchTracks"
        />
        <button class="rounded bg-slate-700 px-4 py-2" :disabled="isSearching" @click="searchTracks">
          {{ isSearching ? '...' : 'Rechercher' }}
        </button>
      </div>

      <p v-if="searchError" class="text-sm text-red-400">{{ searchError }}</p>

      <ul v-if="tracks.length" class="max-h-52 space-y-2 overflow-auto rounded border border-slate-700 p-2">
        <li v-for="track in tracks" :key="track.id" class="flex items-center justify-between rounded bg-slate-800 p-2">
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ track.title }}</p>
            <p class="truncate text-sm text-slate-300">{{ track.artist }}</p>
          </div>
          <button class="rounded bg-cyan-600 px-3 py-1 text-sm" @click="selectedTrack = track">Choisir</button>
        </li>
      </ul>

      <button class="w-fit rounded bg-cyan-500 px-4 py-2 font-semibold" :disabled="!selectedTrack" @click="addMusicFromTrack">
        Ajouter la musique choisie
      </button>

      <ul class="space-y-2">
        <li v-for="music in store.musics" :key="music.id" class="flex items-center justify-between rounded bg-slate-800 p-2">
          <span>{{ music.title }} — {{ music.artist }}</span>
          <button class="rounded bg-red-600 px-3 py-1 text-sm" @click="store.removeMusic(music.id)">Supprimer</button>
        </li>
      </ul>

      <button
        v-if="store.isHost"
        class="w-fit rounded bg-indigo-600 px-4 py-2"
        @click="store.forceStartVoting()"
      >
        Forcer le passage au vote
      </button>
    </section>

    <section v-if="store.phase === 'voting'" class="grid gap-4 rounded bg-slate-900 p-4">
      <h3 class="text-lg font-semibold">Vote</h3>

      <p v-if="store.currentRound" class="text-sm text-slate-300">
        Musique {{ store.currentRound.trackIndex }} / {{ store.currentRound.totalTracks }} · étape {{ store.currentRound.stage }}
      </p>

      <article v-if="store.currentRound" class="rounded bg-slate-800 p-3">
        <h4 class="mb-2 font-semibold">{{ store.currentRound.music.title }} — {{ store.currentRound.music.artist }}</h4>
        <audio class="mb-3 w-full" controls :src="audioUrl(store.currentRound.music.filePath)"></audio>

        <p v-if="store.currentRound.stage === 'extract'" class="text-amber-300">Écoute en cours… vote bloqué.</p>

        <template v-else-if="store.currentRound.stage === 'vote'">
          <p v-if="!store.canVote" class="mb-2 text-amber-300">Vous êtes observateur sur cette partie.</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="option in store.currentRound.options"
              :key="option.id"
              class="rounded border border-slate-600 px-3 py-2 text-left"
              :class="guess === option.id ? 'bg-cyan-700 border-cyan-500' : 'bg-slate-900'"
              :disabled="!store.canVote"
              @click="guess = option.id"
            >
              {{ option.name }} <span class="text-xs text-slate-300">({{ option.votes }} votes)</span>
            </button>
          </div>

          <button class="mt-3 rounded bg-indigo-600 px-4 py-2" :disabled="!guess || !store.canVote" @click="submitVote">
            Enregistrer mon vote
          </button>
        </template>

        <template v-else-if="store.currentRound.stage === 'reveal' && store.currentRound.reveal">
          <p class="font-semibold text-emerald-300">
            La musique a été proposée par {{ store.currentRound.reveal.owner?.name || 'Inconnu' }}
          </p>
          <p class="mt-1 text-sm text-slate-300">
            Corrects: {{ store.currentRound.reveal.correctVoters.map((player) => player.name).join(', ') || 'Aucun' }}
          </p>
        </template>
      </article>

      <div class="rounded bg-slate-800 p-3">
        <h4 class="mb-2 font-semibold">Classement dynamique</h4>
        <ol class="list-decimal space-y-1 pl-6">
          <li v-for="player in store.ranking" :key="player.id">
            {{ player.name }} — {{ player.finalScore }} pts
          </li>
        </ol>
      </div>
    </section>

    <section v-if="store.phase === 'results'" class="grid gap-4 rounded bg-slate-900 p-4">
      <h3 class="text-lg font-semibold">Résultats finaux</h3>

      <article v-for="player in store.ranking" :key="player.id" class="rounded bg-slate-800 p-3">
        <p class="font-semibold">{{ player.name }} — {{ player.finalScore }} points</p>
        <p class="text-sm text-slate-300">
          Votes reçus: {{ player.votesReceived }} | Bonnes réponses: {{ player.correctGuesses }} | Correctement deviné: {{ player.correctlyGuessed }}
        </p>
        <p class="mt-2 text-sm">
          Musiques: {{ tracksByPlayer(player.id).join(', ') || 'Aucune' }}
        </p>
      </article>

      <div class="flex flex-wrap gap-2">
        <router-link to="/" class="rounded bg-slate-700 px-4 py-2">Rejoindre une partie</router-link>
        <button v-if="store.isHost" class="rounded bg-emerald-600 px-4 py-2" @click="store.relaunch()">Relancer une partie</button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const store = useGameStore();

const now = ref(Date.now());
let timer;

const config = reactive({
  maxMusicsPerPlayer: 3,
  selectionDuration: 120,
  extractDuration: 20,
  votingDuration: 30,
  showAnswers: true,
  maxPlayers: null,
});

const botName = ref('Bot');
const searchQuery = ref('');
const tracks = ref([]);
const selectedTrack = ref(null);
const isSearching = ref(false);
const searchError = ref('');
const guess = ref(null);

const origin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const audioUrl = (path) => (path?.startsWith('http://') || path?.startsWith('https://') ? path : `${origin}${path}`);

const phaseLabel = computed(() => {
  if (store.phase === 'waiting') return 'Attente';
  if (store.phase === 'selection') return 'Sélection';
  if (store.phase === 'voting') return 'Vote';
  if (store.phase === 'results') return 'Résultats';
  return store.phase;
});

const endAt = computed(() => {
  if (store.phase === 'selection') {
    return store.session?.selection_ends_at;
  }
  if (store.phase === 'voting') {
    return store.currentRound?.stageEndsAt;
  }
  return null;
});

const remainingSeconds = computed(() => {
  if (!endAt.value) return 0;
  return Math.max(0, Math.ceil((new Date(endAt.value).getTime() - now.value) / 1000));
});

const timerLabel = computed(() => {
  if (store.phase === 'selection') return 'Temps sélection';
  if (store.phase === 'voting') return 'Temps restant';
  return '';
});

const phaseProgress = computed(() => {
  if (store.phase === 'waiting') return 5;

  if (store.phase === 'selection' && store.session?.selection_ends_at) {
    const total = store.session.selection_duration || 1;
    const elapsed = total - remainingSeconds.value;
    return Math.min(100, Math.max(5, (elapsed / total) * 100));
  }

  if (store.phase === 'voting' && store.currentRound) {
    return Math.min(
      100,
      ((store.currentRound.trackIndex - 1 + (store.currentRound.stage === 'extract' ? 0.2 : store.currentRound.stage === 'vote' ? 0.7 : 1)) /
        store.currentRound.totalTracks) *
        100
    );
  }

  if (store.phase === 'results') return 100;
  return 5;
});

const syncConfigFromSession = () => {
  if (!store.session) return;
  config.maxMusicsPerPlayer = store.session.max_musics_per_player;
  config.selectionDuration = store.session.selection_duration;
  config.extractDuration = store.session.extract_duration;
  config.votingDuration = store.session.voting_duration;
  config.showAnswers = store.session.show_answers;
  config.maxPlayers = store.session.max_players;
};

const saveConfig = async () => {
  await store.updateConfig({
    maxMusicsPerPlayer: config.maxMusicsPerPlayer,
    selectionDuration: config.selectionDuration,
    extractDuration: config.extractDuration,
    votingDuration: config.votingDuration,
    showAnswers: config.showAnswers,
    maxPlayers: config.maxPlayers || null,
  });
};

const addBot = async () => {
  if (!botName.value.trim()) return;
  await store.addBot(botName.value.trim());
};

const searchTracks = async () => {
  if (!searchQuery.value.trim()) {
    tracks.value = [];
    selectedTrack.value = null;
    return;
  }

  isSearching.value = true;
  searchError.value = '';

  try {
    const { data } = await apiService.searchDeezer(searchQuery.value);
    tracks.value = data?.tracks || [];
    if (!tracks.value.length) {
      searchError.value = 'Aucun résultat trouvé.';
    }
  } catch {
    searchError.value = 'Recherche indisponible.';
    tracks.value = [];
  } finally {
    isSearching.value = false;
  }
};

const addMusicFromTrack = async () => {
  if (!selectedTrack.value || !store.player?.id) return;

  await store.addMusic({
    playerId: String(store.player.id),
    title: selectedTrack.value.title,
    artist: selectedTrack.value.artist,
    deezerPreviewUrl: selectedTrack.value.preview,
  });

  selectedTrack.value = null;
};

const submitVote = async () => {
  if (!guess.value) return;
  await store.submitVote(guess.value);
};

const tracksByPlayer = (playerId) => store.musics.filter((music) => music.player_id === playerId).map((music) => music.title);

watch(
  () => store.currentRound,
  (round) => {
    guess.value = round?.yourVote || null;
  },
  { immediate: true }
);

watch(
  () => store.session,
  () => syncConfigFromSession(),
  { immediate: true }
);

watch(
  () => route.params.code,
  async (code) => {
    if (!code) return;
    await store.loadSession(code);
    store.connectSocket(code);
  }
);

onMounted(async () => {
  await store.loadSession(route.params.code);
  store.connectSocket(route.params.code);
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  socketService.leave();
  if (timer) {
    clearInterval(timer);
  }
});
</script>
