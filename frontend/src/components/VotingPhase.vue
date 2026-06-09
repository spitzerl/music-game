<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto flex flex-col justify-start gap-4 opacity-0 animate-fade-in-up">
    <!-- Header -->
    <header class="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold text-white flex items-center gap-2">
          <span>{{ status === 'revelation' ? 'Révélation' : 'Phase de Vote' }}</span>
        </h1>
        <p class="text-slate-400 text-sm">
          Morceau <span class="text-cyan-400 font-bold font-mono">{{ (store.session?.current_music_index || 0) + 1 }}</span>
        </p>
      </div>

      <!-- Header Action Controls -->
      <div class="flex items-center gap-3">
        <!-- Host Skip/Next Subphase Button -->
        <button
          v-if="isHost && status === 'voting'"
          @click="advanceSubphase"
          :class="['px-4 py-2 border text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg active:scale-95', everyoneHasVoted ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200']"
        >
          <span>Révéler ({{ totalVotesCast }}/{{ totalEligibleVoters }})</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <!-- Host Manage Players Button -->
        <button v-if="isHost" @click="showPlayersModal = true" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all flex items-center gap-2">
          ⚙️ Gérer les joueurs
        </button>

        <!-- Timer -->
        <div v-if="status !== 'idle'" :class="['flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-lg transition-all duration-300', remainingTime < 10 ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-cyan-400']">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="font-mono">{{ remainingTime }}s</span>
        </div>
      </div>
    </header>

    <!-- Main Board -->
    <main class="grid md:grid-cols-2 gap-8 mb-8 items-start">
      <!-- Status Box -->
      <section class="glass-panel p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
        <!-- Idle Phase (Configuration / Ready to start) -->
        <div v-if="status === 'idle'" class="space-y-6 w-full max-w-xl text-center py-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            Préparation de la manche
          </div>
          <h2 class="text-3xl font-extrabold text-white">Préparez-vous pour la manche {{ (store.session?.current_music_index || 0) + 1 }} !</h2>
          
          <div v-if="isHost" class="py-4">
            <!-- Start Round Button -->
            <button @click="launchRound" class="glow-btn-purple bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 mx-auto text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Manche suivante
            </button>
          </div>

          <div v-else class="space-y-4 py-4">
            <p class="text-sm font-semibold text-slate-400 italic">En attente du lancement de la manche par l'hôte...</p>
            <div class="flex items-center justify-center h-4">
              <span class="w-2 h-2 bg-cyan-400 rounded-full animate-ping mx-1"></span>
              <span class="w-2 h-2 bg-cyan-400 rounded-full animate-ping mx-1" style="animation-delay: 0.2s;"></span>
              <span class="w-2 h-2 bg-cyan-400 rounded-full animate-ping mx-1" style="animation-delay: 0.4s;"></span>
            </div>
          </div>
        </div>

        <!-- Listening Phase -->
        <div v-else-if="status === 'listening'" class="space-y-6">
          <!-- Animated soundwave (Equalizer) -->
          <div class="flex items-end justify-center gap-2 h-16 mb-4 w-40 mx-auto px-4 py-2 bg-slate-900/60 rounded-2xl border border-slate-800/40">
            <span class="w-2 bg-cyan-400 rounded-full animate-eq-1" style="height: 20%;"></span>
            <span class="w-2 bg-cyan-500 rounded-full animate-eq-2" style="height: 40%;"></span>
            <span class="w-2 bg-purple-500 rounded-full animate-eq-3" style="height: 15%;"></span>
            <span class="w-2 bg-purple-600 rounded-full animate-eq-4" style="height: 35%;"></span>
            <span class="w-2 bg-cyan-400 rounded-full animate-eq-5" style="height: 25%;"></span>
          </div>
          <h2 class="text-2xl font-extrabold text-white">Écoute en cours...</h2>
          <p class="text-slate-400 text-sm max-w-md mx-auto">
            Écoutez attentivement l'extrait audio. Les votes ouvriront dès que la lecture sera terminée.
          </p>
        </div>

        <!-- Voting Phase -->
        <div v-else-if="status === 'voting'" class="space-y-4 w-full">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            Vote Ouvert
          </div>
          <h2 class="text-3xl font-extrabold text-white">Qui a proposé ce morceau ?</h2>
          
          <!-- Track details revealed -->
          <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl max-w-md mx-auto flex items-center gap-4 text-left shadow-lg">
            <img v-if="store.currentMusic?.cover_url" :src="store.currentMusic.cover_url" class="w-14 h-14 rounded-xl object-cover shadow-md border border-slate-800/80 flex-shrink-0" />
            <div v-else class="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6C19 6 13 12 13 12v6.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="font-extrabold text-white text-base truncate">{{ store.currentMusic?.title }}</p>
              <p class="text-slate-400 text-sm truncate">{{ store.currentMusic?.artist }}</p>
            </div>
          </div>
        </div>

        <!-- Revelation Phase -->
        <div v-else-if="status === 'revelation'" class="w-full py-4 flex flex-col items-center">
          <div class="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <!-- Large cover art -->
            <div class="relative group mb-5">
              <img v-if="store.currentMusic?.cover_url" :src="store.currentMusic.cover_url" class="w-44 h-44 rounded-2xl object-cover shadow-2xl border border-slate-800 transition-transform duration-500 group-hover:scale-105" />
              <div v-else class="w-44 h-44 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-2xl border border-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 opacity-80">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6C19 6 13 12 13 12v6.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>

            <!-- Song info -->
            <h3 class="text-xl font-extrabold text-white leading-snug truncate max-w-full">{{ store.currentMusic?.title }}</h3>
            <p class="text-sm text-slate-400 font-medium truncate max-w-full mt-1 mb-6">{{ store.currentMusic?.artist }}</p>

            <!-- Proposer -->
            <div class="w-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 py-3 px-5 rounded-2xl flex flex-col items-center justify-center gap-0.5">
              <span class="text-[10px] text-yellow-500/70 uppercase font-black tracking-widest">Proposé par</span>
              <span class="text-xl font-black text-yellow-400 tracking-wide">{{ proposerName }}</span>
            </div>
          </div>

          <!-- Host: advance to next round -->
          <div v-if="isHost" class="mt-6">
            <button @click="advanceFromRevelation" class="glow-btn-purple bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 px-8 rounded-2xl transition-all flex items-center gap-2.5 text-base shadow-lg active:scale-98">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
              </svg>
              Manche suivante
            </button>
          </div>
        </div>

        <!-- Volume slider control -->
        <div class="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-slate-400">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 0 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 0 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" />
          </svg>
          <input type="range" min="0" max="1" step="0.05" v-model="volume" @input="updateVolume" class="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
        </div>
      </section>

      <!-- Interactive Zone (Voting List or Revelation Details) -->
      <section class="glass-panel p-6 rounded-2xl border border-slate-800">
        <!-- Idle Zone Info -->
        <div v-if="status === 'idle'" class="text-center py-6 text-slate-500 italic text-sm">
          En attente du lancement de la manche par l'hôte...
        </div>

        <!-- Voting Active -->
        <div v-else-if="status === 'voting'" class="space-y-4">
          <!-- Proposer Message -->
          <div v-if="isProposer" class="text-center py-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-purple-400 font-medium text-sm">
            📢 Vous avez proposé ce morceau. Votre vote sert uniquement à bluffer les autres joueurs !
          </div>
          <!-- Observer Message -->
          <div v-else-if="isObserver" class="text-center py-6 bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-slate-400 italic text-sm">
            Vous êtes spectateur de cette partie. Observez les votes en direct !
          </div>

          <!-- Voter Buttons Grid -->
          <div v-if="!isObserver" class="space-y-3">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sélectionnez le suspect :</p>
            <TransitionGroup
              name="list"
              tag="div"
              class="grid sm:grid-cols-2 gap-4"
            >
              <button
                v-for="target in eligiblePlayers"
                :key="target.id"
                @click="castVote(target.id)"
                :class="['p-5 rounded-2xl border text-left font-bold transition-all flex justify-between items-center active:scale-[0.98] hover:scale-[1.01] text-base md:text-lg min-h-[64px]', selectedVoteId === target.id ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white']"
              >
                <span class="truncate pr-2">{{ target.name }}</span>
                <!-- Vote Counter -->
                <span v-if="store.session?.show_vote_count && getVoteCountForPlayer(target.id) > 0" class="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[11px] bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 font-bold animate-pulse-glow">
                  {{ getVoteCountForPlayer(target.id) }}
                </span>
              </button>
            </TransitionGroup>
          </div>
        </div>

        <!-- Revelation Details -->
        <div v-else-if="status === 'revelation'" class="space-y-4">
          <h3 class="text-lg font-bold text-white mb-4">Détail des votes</h3>
          <div class="space-y-2 max-h-[450px] overflow-y-auto pr-2">
            <div v-for="vote in store.votes" :key="vote.id" class="flex items-center justify-between py-3.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/10 transition-all px-2 rounded-xl">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-200 text-sm">{{ getPlayerName(vote.voter_id) }}</span>
                <span class="text-xs text-slate-500">pense que c'est</span>
                <span class="font-bold text-slate-200 text-sm">{{ getPlayerName(vote.guessed_player_id) }}</span>
              </div>
              
              <!-- Success / Failure Badge -->
              <span v-if="vote.voter_id === store.currentMusic?.player_id" class="text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded border border-purple-500/25 font-bold uppercase">
                Bluff
              </span>
              <span v-else-if="vote.guessed_player_id === store.currentMusic?.player_id" class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                ✓ Correct +1
              </span>
              <span v-else class="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-bold uppercase">
                ✗ Incorrect
              </span>
            </div>
            <p v-if="!store.votes?.length" class="text-xs text-slate-500 italic text-center py-4">Aucun joueur n'a voté sur ce morceau.</p>
          </div>
        </div>

        <!-- Listening Lock Info -->
        <div v-else-if="status === 'listening'" class="text-center py-6 text-slate-500 italic text-sm">
          Les options de vote apparaîtront dès la fin de l'écoute.
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const remainingTime = ref(0);
let timerInterval = null;

// Local Player State
const selectedVoteId = ref(null);
const volume = ref(localStorage.getItem('cekikilami_volume') ? Number(localStorage.getItem('cekikilami_volume')) : 0.5);

// Audio State
let audio = null;

const status = computed(() => store.session?.voting_status || 'listening');

const isHost = computed(() => {
  return store.player && store.session && store.player.name === store.session.host_name;
});

const launchRound = async () => {
  if (!isHost.value) return;
  try {
    await store.startRound();
  } catch (err) {
    console.error("Failed to launch round:", err);
  }
};

const advanceFromRevelation = async () => {
  if (!isHost.value) return;
  try {
    await store.advanceRound();
  } catch (err) {
    console.error("Failed to advance from revelation:", err);
  }
};

const advanceSubphase = async () => {
  if (!isHost.value) return;
  try {
    await store.advanceRound();
  } catch (err) {
    console.error("Failed to advance subphase:", err);
  }
};

const totalVotesCast = computed(() => {
  if (!store.votes) return 0;
  return Object.values(store.votes).reduce((sum, count) => sum + count, 0);
});

const totalEligibleVoters = computed(() => {
  if (!store.players) return 0;
  return store.players.filter(p => !p.is_observer && p.is_connected).length;
});

const everyoneHasVoted = computed(() => {
  const voters = totalEligibleVoters.value;
  return voters > 0 && totalVotesCast.value >= voters;
});

const handleSpaceAdvance = async () => {
  if (!isHost.value) return;
  try {
    if (status.value === 'idle') {
      await store.startRound();
    } else {
      await store.advanceRound();
    }
  } catch (err) {
    console.error("Failed to advance phase via keyboard:", err);
  }
};

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value) {
    const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (!isTyping) {
      e.preventDefault();
      handleSpaceAdvance();
    }
  }
};


const isObserver = computed(() => {
  return store.player?.is_observer;
});

const isProposer = computed(() => {
  // If show answers is false or not in revelation, we don't return player_id in currentMusic.
  // But wait! If this music was proposed by the player, the player knows it.
  // Wait, does the player's own local state store their submitted musics?
  // No, but we can verify if the voter is the proposer by matching the voter ID with the music's proposer ID.
  // Wait, since currentMusic has no player_id during voting to prevent cheating, how does the client know if the local player is the proposer?
  // Ah! In `GameService.js` we delete `currentMusic.player_id` to prevent cheating.
  // But wait! In the DB, does the music belong to the voter?
  // Yes! The player knows their own music. But how does the Vue code know?
  // Wait! In `GameService.js`, when returning the state:
  // "un joueur ne peut PAS voter s'il a proposé la musique."
  // If the voter tries to submit a vote for their own music, the API will return a 400 error!
  // To avoid displaying voter options if they proposed it, how can the client detect it?
  // Ah! If `store.musics` (which contains the player's own uploaded musics) has a music with the same preview URL or title/artist as the `currentMusic`, then they proposed it!
  // Oh, that is extremely clever! Since `store.musics` contains the list of all musics uploaded by the current player, we can just check if any of them matches!
  if (!store.currentMusic) return false;
  return store.musics.some(m => m.file_path === store.currentMusic.file_path || (m.title === store.currentMusic.title && m.artist === store.currentMusic.artist));
});

const eligiblePlayers = computed(() => {
  if (!store.players) return [];
  // Return all active players except themselves, sorted alphabetically
  return store.players
    .filter(p => !p.is_observer && p.id !== store.player?.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
});

const proposerName = computed(() => {
  if (!store.currentMusic || !store.currentMusic.player_id) return 'Inconnu';
  const player = store.players.find(p => p.id === store.currentMusic.player_id);
  return player ? player.name : 'Inconnu';
});

const getPlayerName = (id) => {
  const p = store.players.find(player => player.id === id);
  return p ? p.name : 'Inconnu';
};

const getVoteCountForPlayer = (playerId) => {
  if (status.value === 'voting' && store.votes) {
    return store.votes[playerId] || 0;
  }
  return 0;
};

const formatAudioUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = import.meta.env.VITE_API_URL || '';
  return `${apiBase}${path}`;
};

const updateVolume = () => {
  if (audio) {
    audio.volume = volume.value;
  }
  localStorage.setItem('cekikilami_volume', String(volume.value));
};

const startAudio = () => {
  if (audio) {
    audio.pause();
  }
  
  if (store.currentMusic?.file_path) {
    const url = formatAudioUrl(store.currentMusic.file_path);
    audio = new Audio(url);
    audio.volume = volume.value;
    
    if (status.value === 'listening') {
      audio.play().catch(err => {
        console.warn("Autoplay was blocked or audio failed:", err);
      });
    }
  }
};

const castVote = async (targetId) => {
  if (isObserver.value || status.value !== 'voting') return;
  
  try {
    selectedVoteId.value = targetId;
    await store.submitVote(store.currentMusic.id, targetId);
  } catch (err) {
    console.error("Failed to submit vote:", err);
  }
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

onMounted(async () => {
  if (!store.player) {
    router.push(`/game/${route.params.code}`);
    return;
  }
  
  await store.loadSession(route.params.code);
  store.connectSocket(route.params.code);
  
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  // Play audio immediately if we are in listening subphase
  startAudio();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (audio) {
    audio.pause();
  }
  window.removeEventListener('keydown', handleKeyDown);
});

// Watch current music to reload audio
watch(() => store.currentMusic?.id, () => {
  selectedVoteId.value = null; // reset vote selection for next track
  startAudio();
});

// Watch voting status
watch(() => status.value, (newStatus) => {
  if (newStatus === 'listening') {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn(e));
    } else {
      startAudio();
    }
  } else {
    // Stop audio on voting or revelation
    if (audio) {
      audio.pause();
    }
  }
});

// Watch phase change to redirect to results
watch(() => store.session?.phase, (newPhase) => {
  if (newPhase === 'results') {
    router.push(`/game/${route.params.code}/results`);
  } else if (newPhase === 'selection') {
    router.push(`/game/${route.params.code}/selection`);
  } else if (newPhase === 'waiting') {
    router.push(`/game/${route.params.code}`);
  }
});

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
