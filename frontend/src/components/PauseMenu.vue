<template>
  <div v-if="isVisible">
    <!-- Floating Menu Trigger Button -->
    <button
      v-if="!isOpen"
      @click="openMenu"
      class="fixed bottom-6 right-6 z-40 pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 backdrop-blur-md text-slate-200 hover:text-white shadow-lg transition-all active:scale-95 hover:border-cyan-500/40 group"
      aria-label="Ouvrir le menu de pause"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 transition-transform group-hover:scale-110">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
      </svg>
    </button>

    <!-- Pause Menu Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-800 shadow-2xl relative bg-slate-900/90 text-left transition-all duration-300">
          
          <!-- Close button -->
          <button @click="closeMenu" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-all text-xl font-bold" aria-label="Fermer le menu">
            ✕
          </button>

          <!-- Main Menu -->
          <div v-if="currentTab === 'main'" class="space-y-6">
            <div class="text-center pb-2 border-b border-slate-800/80">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              </div>
              <h2 class="text-2xl font-black text-white tracking-wide">Partie en Pause</h2>
              <div class="flex items-center justify-center gap-1.5 mt-2">
                <span class="text-xs text-slate-400">Code de la session :</span>
                <span @click="copyLink" class="font-mono text-xs text-cyan-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 cursor-pointer hover:bg-slate-800 hover:border-cyan-500/40 transition-all active:scale-95 inline-flex items-center gap-1" title="Copier le lien d'invitation">
                  {{ store.session?.code }}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 opacity-60">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-3a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5h.75m-.75 3h.75m-.75 3h.75m-.75 3h.75M19.5 7.5h-12c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125h12c.621 0 1.125-.504 1.125-1.125V8.625c0-.621-.504-1.125-1.125-1.125Z" />
                  </svg>
                </span>
                <span v-if="copied" class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-fade-in">Lien copié !</span>
              </div>
            </div>

            <!-- Actions list -->
            <div class="flex flex-col gap-3">
              <!-- Reprendre -->
              <button
                @click="closeMenu"
                class="w-full py-3.5 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all flex items-center justify-center gap-2 text-base shadow-lg active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Reprendre la partie
              </button>

              <!-- Gérer les joueurs -->
              <button
                @click="currentTab = 'players'"
                class="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-purple-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A3.318 3.318 0 0 1 11.682 22H8.318A3.318 3.318 0 0 1 5 19.237v-.109c0-1.113.285-2.16.786-3.07M15 19.128v-.109a3.318 3.318 0 0 0-3.318-3.318H8.318a3.318 3.318 0 0 0-3.318 3.318v.109M15 19.128v.109c0 .248-.027.493-.08.73M5 19.128v.109c.053.237.08.482.08.73m0 0A3.318 3.318 0 0 1 8.318 22h3.364a3.318 3.318 0 0 0 3.238-2.673M5 19.128v-.109c0-.218.02-.435.06-.645m10.28 0a3.3 3.3 0 0 0-.06-.645M19.5 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.75 6a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm13.5 9a2.25 2.25 0 0 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" />
                </svg>
                Gérer les joueurs ({{ store.players.length }})
              </button>

              <!-- Retourner au lobby (Hôte seulement, hors page waiting room elle-même) -->
              <button
                v-if="isHost && isNotInWaitingRoom"
                @click="confirmReset"
                class="w-full py-3.5 px-5 rounded-2xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-300 font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Retourner au salon d'attente
              </button>

              <!-- Quitter la partie -->
              <button
                @click="confirmLeave"
                class="w-full py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Quitter la partie
              </button>
            </div>
          </div>

          <!-- Player Management Submenu -->
          <div v-else class="space-y-6">
            <div class="flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <button @click="currentTab = 'main'" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                ⚙️ Gestion des joueurs
              </h2>
            </div>

            <!-- Players List -->
            <div class="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              <div v-for="p in store.players" :key="p.id" class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div class="flex items-center gap-3 min-w-0">
                  <span :class="['w-2 h-2 rounded-full flex-shrink-0', p.is_connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500']" :title="p.is_connected ? 'Connecté' : 'Déconnecté'"></span>
                  <span class="font-bold text-slate-200 text-sm truncate max-w-[150px]">{{ p.name }}</span>
                  <span v-if="p.is_bot" class="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider flex-shrink-0">Bot</span>
                  <span v-if="p.name === store.session?.host_name" class="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider flex-shrink-0">Hôte</span>
                </div>
                
                <div class="flex gap-2 flex-shrink-0">
                  <!-- Actions reserved for Host targeting other human players -->
                  <template v-if="isHost && p.id !== store.player?.id">
                    <!-- Promote to Host -->
                    <button v-if="!p.is_bot" @click="promotePlayer(p.id)" title="Promouvoir Hôte (Transférer les droits)" class="p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 transition-all active:scale-90">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v11.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <!-- Kick Player -->
                    <button @click="kickPlayer(p.id)" title="Exclure de la partie" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all active:scale-90">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const route = useRoute();
const router = useRouter();
const store = useGameStore();

const isOpen = ref(false);
const currentTab = ref('main');
const copied = ref(false);

const isVisible = computed(() => {
  return store.session && store.player && route.path.startsWith('/game/');
});

const isHost = computed(() => {
  return store.player && store.session && store.player.name === store.session.host_name;
});

const isNotInWaitingRoom = computed(() => {
  return route.path !== `/game/${store.session?.code}`;
});

const openMenu = () => {
  isOpen.value = true;
  currentTab.value = 'main';
};

const closeMenu = () => {
  isOpen.value = false;
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isVisible.value) {
    if (isOpen.value) {
      if (currentTab.value === 'players') {
        currentTab.value = 'main';
      } else {
        closeMenu();
      }
    } else {
      openMenu();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const copyLink = async () => {
  try {
    const inviteLink = `${window.location.origin}/game/${store.session?.code}`;
    await navigator.clipboard.writeText(inviteLink);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy link:", err);
  }
};

const confirmReset = async () => {
  if (confirm("Voulez-vous vraiment retourner au salon d'attente ? La manche actuelle et les musiques soumises seront réinitialisées.")) {
    try {
      await store.resetSession();
      closeMenu();
    } catch (err) {
      console.error("Failed to reset session:", err);
    }
  }
};

const confirmLeave = () => {
  const msg = isHost.value 
    ? "Vous êtes l'hôte. Quitter la partie supprimera la session. Voulez-vous vraiment continuer ?" 
    : "Voulez-vous vraiment quitter la partie ?";
  if (confirm(msg)) {
    store.leaveSession();
    closeMenu();
  }
};

const promotePlayer = async (targetId) => {
  if (confirm("Voulez-vous vraiment désigner ce joueur comme Hôte ? Vous perdrez vos droits d'administration.")) {
    try {
      await store.promotePlayer(targetId);
      currentTab.value = 'main';
    } catch (err) {
      console.error("Failed to promote player:", err);
    }
  }
};

const kickPlayer = async (targetId) => {
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
