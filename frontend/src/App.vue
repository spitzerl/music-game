<template>
  <main class="min-h-screen relative">
    <!-- Notifications Overlay -->
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <TransitionGroup name="notification">
        <div
          v-for="notif in store.notifications"
          :key="notif.id"
          class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300"
          :class="getNotifClass(notif.type)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Icon -->
            <component :is="getNotifIcon(notif.type)" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-semibold text-white truncate">{{ notif.message }}</span>
          </div>
          <!-- Close button -->
          <button @click="removeNotif(notif.id)" class="text-white/60 hover:text-white transition-colors" aria-label="Fermer la notification">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Pause Menu (Only when in game) -->
    <PauseMenu />

    <router-view />
  </main>
</template>

<script setup>
import { useGameStore } from './stores/gameStore';
import PauseMenu from './components/PauseMenu.vue';
import { h } from 'vue';

const store = useGameStore();

const removeNotif = (id) => {
  store.notifications = store.notifications.filter(n => n.id !== id);
};

const getNotifClass = (type) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20';
    case 'warning':
      return 'bg-amber-950/80 border-amber-500/30 text-amber-200 shadow-amber-950/20';
    case 'error':
      return 'bg-rose-950/80 border-rose-500/30 text-rose-200 shadow-rose-950/20';
    default:
      return 'bg-slate-900/80 border-slate-700/50 text-slate-200 shadow-slate-950/20';
  }
};

const getNotifIcon = (type) => {
  const svgProps = { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', strokeWidth: '2.5', stroke: 'currentColor' };
  
  if (type === 'success') {
    return () => h('svg', svgProps, [
      h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' })
    ]);
  }
  if (type === 'warning') {
    return () => h('svg', svgProps, [
      h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' })
    ]);
  }
  if (type === 'error') {
    return () => h('svg', svgProps, [
      h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 7.5h.008v.008H12v-.008z' })
    ]);
  }
  return () => h('svg', svgProps, [
    h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M11.25 11.25l.041-.02a.75.75 0 111.084.708l-.397 1.396a.75.75 0 001.107.828l.04-.02zM12 8.25a.825.825 0 120-1.65.825.825 0 020 1.65zM21 12a9 9 0 11-18 0 9 9 0 0 1 18 0' })
  ]);
};
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.notification-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.notification-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
