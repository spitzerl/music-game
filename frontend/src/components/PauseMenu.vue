<template>
  <div v-if="isVisible">
    <!-- Floating Controls Container (Pause & Volume) -->
    <div v-if="!isOpen" class="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <!-- Volume Control Button with Hover Slider -->
      <div class="relative group">
        <button
          class="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 backdrop-blur-md text-slate-200 hover:text-white shadow-lg transition-all active:scale-95 hover:border-cyan-500/40"
          aria-label="Gérer le volume"
        >
          <!-- Speaker Icon dynamic based on volume value -->
          <i v-if="store.volume === 0" class="fa-solid fa-volume-xmark text-[18px]"></i>
          <i v-else-if="store.volume < 0.4" class="fa-solid fa-volume-low text-[18px]"></i>
          <i v-else class="fa-solid fa-volume-high text-[18px]"></i>
        </button>

        <!-- Hover Volume Popup -->
        <div class="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-800 backdrop-blur-md w-10 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1.5 transition-all duration-300 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto origin-bottom scale-90 group-hover:scale-100 mb-1 z-50 before:absolute before:inset-x-0 before:-bottom-3 before:h-3 before:content-['']">
          <!-- Volume slider wrapper -->
          <div class="h-24 w-4 flex items-center justify-center overflow-visible">
            <!-- Vertical volume slider -->
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              v-model="store.volume"
              @input="updateStoreVolume"
              class="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 origin-center -rotate-90"
            />
          </div>
          <span class="text-[10px] font-bold font-mono text-cyan-400 mt-1 select-none">
            {{ Math.round(store.volume * 100) }}%
          </span>
        </div>
      </div>

      <!-- Floating Menu Trigger Button (Pause) -->
      <button
        @click="openMenu"
        class="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 backdrop-blur-md text-slate-200 hover:text-white shadow-lg transition-all active:scale-95 hover:border-cyan-500/40 group"
        aria-label="Ouvrir le menu de pause"
      >
        <i class="fa-solid fa-pause text-[18px] transition-transform group-hover:scale-110"></i>
      </button>
    </div>

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
                <i class="fa-solid fa-pause text-[22px]"></i>
              </div>
              <h2 class="text-2xl font-black text-white tracking-wide">Partie en Pause</h2>
              <div class="flex items-center justify-center gap-1.5 mt-2">
                <span class="text-xs text-slate-400">Code de la session :</span>
                <span @click="copyLink" class="font-mono text-xs text-cyan-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 cursor-pointer hover:bg-slate-800 hover:border-cyan-500/40 transition-all active:scale-95 inline-flex items-center gap-1" title="Copier le lien d'invitation">
                  {{ store.session?.code }}
                  <i class="fa-regular fa-copy text-[12px] opacity-60"></i>
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
                <i class="fa-solid fa-play text-[16px]"></i>
                Reprendre la partie
              </button>

              <!-- Gérer les joueurs -->
              <button
                @click="currentTab = 'players'"
                class="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <i class="fa-solid fa-users text-[16px] text-purple-400"></i>
                Gérer les joueurs ({{ store.players.length }})
              </button>

              <!-- Retourner au lobby (Hôte seulement, hors page waiting room elle-même) -->
              <button
                v-if="isHost && isNotInWaitingRoom"
                @click="confirmReset"
                class="w-full py-3.5 px-5 rounded-2xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-300 font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <i class="fa-solid fa-arrow-rotate-left text-[16px]"></i>
                Retourner au salon d'attente
              </button>

              <!-- Quitter la partie -->
              <button
                @click="confirmLeave"
                class="w-full py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <i class="fa-solid fa-arrow-right-from-bracket text-[16px]"></i>
                Quitter la partie
              </button>
            </div>
          </div>

          <!-- Player Management Submenu -->
          <div v-else class="space-y-6">
            <div class="flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <button @click="currentTab = 'main'" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <i class="fa-solid fa-chevron-left text-[16px]"></i>
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
                      <i class="fa-solid fa-crown text-[13px]"></i>
                    </button>
                    <!-- Kick Player -->
                    <button @click="kickPlayer(p.id)" title="Exclure de la partie" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all active:scale-90">
                      <i class="fa-solid fa-user-slash text-[13px]"></i>
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
  try {
    await store.resetSession();
    closeMenu();
  } catch (err) {
    console.error("Failed to reset session:", err);
  }
};

const confirmLeave = () => {
  store.leaveSession();
  closeMenu();
  router.push('/');
};

const promotePlayer = async (targetId) => {
  try {
    await store.promotePlayer(targetId);
    currentTab.value = 'main';
  } catch (err) {
    console.error("Failed to promote player:", err);
  }
};

const kickPlayer = async (targetId) => {
  try {
    await store.kickPlayer(targetId);
  } catch (err) {
    console.error("Failed to kick player:", err);
  }
};

const updateStoreVolume = () => {
  store.volume = Number(store.volume);
  localStorage.setItem('cekikilami_volume', String(store.volume));
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
