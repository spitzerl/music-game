<template>
  <!-- Loading -->
  <div v-if="isLoading" class="min-h-dvh flex items-center justify-center" role="status" aria-label="Chargement en cours">
    <div class="flex items-center gap-3 text-[var(--text-secondary)]">
      <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
      <span class="font-semibold">Chargement…</span>
    </div>
  </div>

  <!-- Direct join form (arriving via URL) -->
  <div v-else-if="!store.player || store.player.session_id !== store.session?.id"
    class="relative min-h-dvh flex items-center justify-center p-4 overflow-hidden">
    <div class="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-[120px] opacity-20 bg-indigo-600 pointer-events-none" aria-hidden="true"></div>
    <div class="absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-[120px] opacity-20 bg-violet-600 pointer-events-none" aria-hidden="true"></div>

    <div class="relative z-10 glass-panel p-8 rounded-2xl shadow-xl w-full max-w-sm border border-indigo-500/20 animate-fade-in-up opacity-0">
      <h1 class="text-2xl font-extrabold text-center mb-1">
        <span class="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Rejoindre la partie
        </span>
      </h1>
      <p class="text-sm text-center text-[var(--text-secondary)] mb-6">
        Code : <span class="font-mono font-bold text-indigo-300">{{ route.params.code }}</span>
      </p>
      <form @submit.prevent="joinDirectly" class="space-y-4" novalidate>
        <div>
          <label for="direct-pseudo" class="form-label">Votre Pseudo</label>
          <input id="direct-pseudo" v-model="directPseudo" required class="form-input" placeholder="Entrez un pseudo" autocomplete="nickname" maxlength="32" />
        </div>
        <button type="submit" class="btn btn-primary w-full" :disabled="!directPseudo.trim()">
          Rejoindre
        </button>
      </form>
      <div v-if="errorMsg" role="alert" aria-live="polite" class="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style="background:var(--clr-danger-dim);border:1px solid rgba(244,63,94,.3);color:#fda4af">
        {{ errorMsg }}
      </div>
    </div>
  </div>

  <!-- Waiting Room -->
  <div v-else class="page-container animate-fade-in-up opacity-0">

    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Salon de Jeu</h1>
        <div class="flex items-center gap-2 flex-wrap mt-1">
          <span class="text-sm text-[var(--text-secondary)]">Inviter :</span>
          <button @click="copyCode" :title="'Copier le lien d\'invitation'"
            class="font-mono text-indigo-300 font-bold bg-[var(--surface-raised)] px-2.5 py-0.5 rounded-lg border border-[var(--border-strong)] cursor-pointer hover:border-indigo-500/50 hover:bg-[var(--surface-overlay)] transition-all inline-flex items-center gap-1.5 active:scale-95 text-sm touch-target"
            :aria-label="`Copier le lien d'invitation — code ${route.params.code}`">
            {{ route.params.code }}
            <svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664"/></svg>
          </button>
          <Transition name="fade">
            <span v-if="copied" class="badge badge-success">Lien copié !</span>
          </Transition>
        </div>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl" style="background:var(--surface-raised);border:1px solid var(--border-strong)">
        <span class="status-dot online animate-pulse"></span>
        <span class="text-sm font-semibold text-[var(--text-secondary)]">En attente</span>
      </div>
    </header>

    <div class="grid md:grid-cols-3 gap-6 items-start">

      <!-- Config Panel -->
      <section class="glass-panel p-5 rounded-2xl md:col-span-1 border border-[var(--border-strong)]" aria-labelledby="config-heading">
        <!-- Mobile toggle header -->
        <button
          class="flex justify-between items-center w-full md:cursor-default"
          @click="toggleConfigMobile"
          :aria-expanded="showConfigOnMobile"
          aria-controls="config-body"
        >
          <h2 id="config-heading" class="section-header">
            <svg class="w-5 h-5 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
            Paramètres
          </h2>
          <svg class="w-5 h-5 text-[var(--text-secondary)] md:hidden transition-transform" :class="showConfigOnMobile ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </button>

        <div id="config-body" :class="['mt-5 space-y-5 transition-all duration-300', showConfigOnMobile ? 'block' : 'hidden md:block']">
          <!-- Musiques par joueur -->
          <fieldset>
            <legend class="form-label">Musiques par joueur</legend>
            <div class="seg-control">
              <button v-for="val in [1,2,3,4,5]" :key="val" type="button"
                @click="isHost && (config.maxMusicsPerPlayer=val) && saveConfig()"
                :disabled="!isHost"
                :class="['seg-btn', config.maxMusicsPerPlayer===val ? 'active-accent' : '']"
                :aria-pressed="config.maxMusicsPerPlayer===val"
              >{{ val }}</button>
            </div>
          </fieldset>

          <!-- Durée sélection -->
          <fieldset>
            <legend class="form-label">Durée de sélection</legend>
            <div class="seg-control flex-wrap">
              <button v-for="opt in [{v:30,l:'30s'},{v:60,l:'1m'},{v:120,l:'2m'},{v:180,l:'3m'},{v:300,l:'5m'}]" :key="opt.v" type="button"
                @click="isHost && (config.selectionDuration=opt.v) && saveConfig()"
                :disabled="!isHost"
                :class="['seg-btn', config.selectionDuration===opt.v ? 'active-accent' : '']"
                :aria-pressed="config.selectionDuration===opt.v"
              >{{ opt.l }}</button>
            </div>
          </fieldset>

          <!-- Durée extrait -->
          <fieldset>
            <legend class="form-label">Durée d'extrait</legend>
            <div class="seg-control">
              <button v-for="val in [10,15,20,30]" :key="val" type="button"
                @click="isHost && (config.extractDuration=val) && saveConfig()"
                :disabled="!isHost"
                :class="['seg-btn', config.extractDuration===val ? 'active-accent' : '']"
                :aria-pressed="config.extractDuration===val"
              >{{ val }}s</button>
            </div>
          </fieldset>

          <!-- Temps de vote -->
          <fieldset>
            <legend class="form-label">Temps de vote</legend>
            <div class="seg-control flex-wrap">
              <button v-for="val in [20,30,40,50,60]" :key="val" type="button"
                @click="isHost && (config.votingDuration=val) && saveConfig()"
                :disabled="!isHost"
                :class="['seg-btn', config.votingDuration===val ? 'active-accent' : '']"
                :aria-pressed="config.votingDuration===val"
              >{{ val }}s</button>
            </div>
          </fieldset>

          <!-- Toggles -->
          <div class="divide-y" style="divide-color:var(--border)">
            <div v-for="toggle in toggleOptions" :key="toggle.key" class="flex items-center justify-between py-3">
              <label :for="`toggle-${toggle.key}`" class="text-sm text-[var(--text-secondary)] font-semibold pr-4 cursor-pointer">
                {{ toggle.label }}
              </label>
              <label class="switch-container">
                <input :id="`toggle-${toggle.key}`" type="checkbox" v-model="config[toggle.key]" :disabled="!isHost" @change="saveConfig" class="switch-input" />
                <span class="switch-track"><span class="switch-thumb"></span></span>
              </label>
            </div>
          </div>

          <!-- Limite joueurs -->
          <fieldset>
            <legend class="form-label">Limite de joueurs</legend>
            <div class="seg-control">
              <button v-for="val in [4,8,12,16]" :key="val" type="button"
                @click="isHost && (config.maxPlayers=val) && saveConfig()"
                :disabled="!isHost"
                :class="['seg-btn', config.maxPlayers===val ? 'active-accent' : '']"
                :aria-pressed="config.maxPlayers===val"
              >{{ val }}</button>
            </div>
          </fieldset>

          <p v-if="!isHost" class="text-center text-xs text-[var(--text-muted)] italic pt-1">
            Seul l'hôte peut modifier ces règles.
          </p>
        </div>
      </section>

      <!-- Players List -->
      <section class="glass-panel p-5 rounded-2xl md:col-span-2 border border-[var(--border-strong)] flex flex-col" aria-labelledby="players-heading">
        <div class="flex justify-between items-center mb-5 pb-4 border-b border-[var(--border)]">
          <h2 id="players-heading" class="section-header">
            <svg class="w-5 h-5 icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>
            Joueurs connectés
          </h2>
          <span class="badge badge-muted" aria-label="`${store.players.length} joueurs sur ${store.session?.max_players || 8}`">
            {{ store.players.length }} / {{ store.session?.max_players || 8 }}
          </span>
        </div>

        <TransitionGroup name="list" tag="div" class="flex-1 min-h-[200px]" aria-live="polite">
          <div v-for="player in store.players" :key="player.id"
            class="player-row" :class="{ 'opacity-40': !player.is_connected }">
            <div class="flex items-center gap-3 min-w-0">
              <span :class="['status-dot', player.is_connected ? 'online animate-pulse' : 'offline']"
                :aria-label="player.is_connected ? 'Connecté' : 'Déconnecté'"></span>
              <img v-if="player.avatar_seed"
                :src="`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${player.avatar_seed}&backgroundColor=6366f1,8b5cf6,06b6d4,f43f5e,10b981`"
                class="player-avatar" :alt="`Avatar de ${player.name}`" loading="lazy" />
              <span class="font-bold text-white truncate text-sm">{{ player.name }}</span>
              <button v-if="player.id === store.player?.id" @click.stop="regenerateAvatar(player.id)"
                class="btn btn-ghost btn-icon" style="width:32px;height:32px;border-radius:var(--r-sm)" title="Générer un nouvel avatar" aria-label="Générer un nouvel avatar">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
              </button>
              <span v-if="player.is_bot" class="badge badge-bot">Bot</span>
              <span v-if="player.name === store.session?.host_name" class="badge badge-host">Hôte</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs font-semibold" :class="player.is_connected ? 'text-emerald-400' : 'text-[var(--text-muted)]'">
                {{ player.is_connected ? 'Prêt' : 'Déconnecté' }}
              </span>
              <div v-if="isHost && player.id !== store.player?.id" class="flex gap-1.5 pl-3 border-l border-[var(--border)]">
                <button v-if="!player.is_bot" @click="promotePlayer(player.id)" title="Promouvoir Hôte"
                  aria-label="`Promouvoir ${player.name} comme hôte`"
                  class="btn btn-icon touch-target" style="width:36px;height:36px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#fcd34d;border-radius:var(--r-sm)">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v11.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </button>
                <button @click="kickPlayer(player.id)" title="Exclure du salon"
                  :aria-label="`Exclure ${player.name} du salon`"
                  class="btn btn-icon touch-target" style="width:36px;height:36px;background:var(--clr-danger-dim);border:1px solid rgba(244,63,94,.25);color:#fda4af;border-radius:var(--r-sm)">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- Desktop CTAs -->
        <div class="mt-6 pt-5 border-t border-[var(--border)] hidden md:flex flex-col sm:flex-row gap-3">
          <template v-if="isHost">
            <button @click="addBot" class="btn btn-ghost flex-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              Ajouter un Bot
            </button>
            <button @click="startSelection" class="btn btn-primary flex-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/></svg>
              Lancer la Sélection
            </button>
          </template>
          <div v-else class="w-full text-center py-3 px-4 rounded-xl text-sm text-[var(--text-secondary)] italic" style="background:var(--surface-raised);border:1px solid var(--border)">
            En attente de l'hôte <strong class="text-white not-italic">{{ store.session?.host_name }}</strong>…
          </div>
        </div>
      </section>
    </div>

    <!-- Mobile sticky bottom bar (host only) -->
    <div v-if="isHost" class="bottom-bar md:hidden animate-fade-in-up opacity-0" style="animation-delay:.3s">
      <button @click="addBot" class="btn btn-ghost flex-1 text-sm">
        🤖 + Bot
      </button>
      <button @click="startSelection" class="btn btn-primary flex-[2] text-sm font-black">
        🚀 Lancer la Sélection
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route  = useRoute();
const router = useRouter();
const store  = useGameStore();

const directPseudo      = ref('');
const errorMsg          = ref(null);
const isLoading         = ref(true);
const showConfigOnMobile = ref(false);
const copied            = ref(false);

const toggleOptions = [
  { key: 'showAnswers',     label: 'Révéler les réponses' },
  { key: 'autoAdvance',     label: 'Enchaîner les manches' },
  { key: 'showVoteCount',   label: 'Afficher le nombre de votes' },
  { key: 'enableBlindTest', label: 'Blind Test QCM (+1 pt)' },
];

const toggleConfigMobile = () => {
  if (window.innerWidth < 768) showConfigOnMobile.value = !showConfigOnMobile.value;
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/game/${route.params.code}`);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {}
};

const config = reactive({
  maxMusicsPerPlayer: 2,
  selectionDuration: 120,
  extractDuration: 20,
  votingDuration: 30,
  showAnswers: true,
  maxPlayers: 8,
  autoAdvance: false,
  showVoteCount: true,
  enableBlindTest: false,
});

const isHost = computed(() =>
  store.player && store.session && store.player.name === store.session.host_name
);

const syncConfig = (s) => {
  if (!s) return;
  config.maxMusicsPerPlayer = s.max_musics_per_player;
  config.selectionDuration  = s.selection_duration;
  config.extractDuration    = s.extract_duration;
  config.votingDuration     = s.voting_duration;
  config.showAnswers        = s.show_answers;
  config.maxPlayers         = s.max_players;
  config.autoAdvance        = s.auto_advance;
  config.showVoteCount      = s.show_vote_count;
  config.enableBlindTest    = s.enable_blind_test;
};

const loadAndSyncConfig = async () => {
  await store.loadSession(route.params.code);
  syncConfig(store.session);
};

const handleKeyDown = (e) => {
  if (e.code === 'Space' && isHost.value) {
    if (!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
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
    console.error('Failed to load waiting room:', err);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));

watch(() => store.session, (s) => {
  if (!s) return;
  syncConfig(s);
  if (s.phase === 'selection') router.push(`/game/${route.params.code}/selection`);
  else if (s.phase === 'voting') router.push(`/game/${route.params.code}/voting`);
  else if (s.phase === 'results') router.push(`/game/${route.params.code}/results`);
}, { deep: true });

const joinDirectly = async () => {
  errorMsg.value = null;
  try {
    const code = route.params.code.toUpperCase();
    await store.joinSession(code, directPseudo.value);
    store.connectSocket(code);
    await loadAndSyncConfig();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Erreur de connexion';
  }
};

const saveConfig = async () => {
  if (!isHost.value) return;
  try {
    await store.updateConfig({ ...config, maxMusicsPerPlayer: config.maxMusicsPerPlayer });
  } catch (err) { console.error('Failed to update config:', err); }
};

const addBot          = async () => { if (isHost.value) try { await store.addBot(); } catch {} };
const startSelection  = async () => { if (isHost.value) try { await store.startSelection(); } catch {} };
const promotePlayer   = async (id) => { if (confirm("Désigner ce joueur comme Hôte ? Vous perdrez vos droits.")) try { await store.promotePlayer(id); } catch {} };
const kickPlayer      = async (id) => { if (confirm("Exclure ce joueur du salon ?")) try { await store.kickPlayer(id); } catch {} };
const regenerateAvatar = async (id) => { try { await store.regenerateAvatar(id); } catch {} };
</script>
