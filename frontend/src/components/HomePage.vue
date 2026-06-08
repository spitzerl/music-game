<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden bg-slate-950">
    <!-- Floating background elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div class="floating-item text-cyan-500/20 text-3xl" style="left: 8%; animation-delay: 0s; animation-duration: 14s;">🎵</div>
      <div class="floating-item text-purple-500/20 text-4xl" style="left: 22%; animation-delay: 3s; animation-duration: 18s;">🎶</div>
      <div class="floating-item text-teal-500/20 text-2xl" style="left: 45%; animation-delay: 6s; animation-duration: 13s;">🎧</div>
      <div class="floating-item text-purple-500/20 text-3xl" style="left: 73%; animation-delay: 1.5s; animation-duration: 19s;">🎵</div>
      <div class="floating-item text-cyan-500/20 text-4xl" style="left: 88%; animation-delay: 8s; animation-duration: 15s;">🎹</div>
    </div>

    <!-- Decorative background blobs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-25 animate-pulse z-0"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600 rounded-full filter blur-[128px] opacity-25 animate-pulse z-0" style="animation-delay: 2s;"></div>

    <div class="relative z-10 w-full max-w-6xl flex flex-col gap-6 md:gap-8">
      <!-- Title & Branding -->
      <div class="text-center mb-2 animate-float">
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-3">
          <span class="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">
            Devine Beat
          </span>
        </h1>
        <p class="text-sm md:text-base text-slate-400 font-medium max-w-md mx-auto">
          Le jeu de blind test social interactif. Devinez qui a proposé chaque morceau et devenez le maître du rythme.
        </p>
      </div>

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        <!-- Left Column: Game presentation, Rules & Simulator (Order 2 on mobile, 1 on desktop) -->
        <div class="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1 opacity-0 animate-fade-in-up" style="animation-delay: 0.1s;">
          
          <!-- Presentation -->
          <div class="glass-panel p-6 rounded-2xl border border-cyan-500/10">
            <h2 class="text-2xl font-extrabold mb-2 text-white flex items-center gap-2">
              Le Concept <span class="text-cyan-400">💡</span>
            </h2>
            <p class="text-sm text-slate-300 leading-relaxed">
              Un blind test pas comme les autres ! Chaque joueur propose secrètement des musiques en accord avec un thème imposé par l'hôte. Écoutez les extraits, décelez les goûts ou indices de vos amis, et votez pour le suspect idéal. Cumulez des points en trouvant les bons auteurs ou en piégeant tout le monde !
            </p>
          </div>

          <!-- Interactive Rules Step Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Step 1 -->
            <div class="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all duration-300 group">
              <div class="flex items-center gap-3 mb-2.5">
                <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-cyan-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0v15m0-15l-10.5 3m10.5-3v13.5m-10.5 3a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10.5-1.5a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
                  </svg>
                </div>
                <span class="text-xs font-black text-cyan-400 tracking-wider uppercase">Étape 1</span>
              </div>
              <h4 class="text-sm font-bold text-slate-200 mb-1">La Sélection</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Trouvez et proposez secrètement la meilleure musique YouTube en rapport avec le thème de la manche.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-teal-500/30 hover:-translate-y-0.5 transition-all duration-300 group">
              <div class="flex items-center gap-3 mb-2.5">
                <div class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-teal-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0 1 18 0v6M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3v-7Zm18 0h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v-7Z" />
                  </svg>
                </div>
                <span class="text-xs font-black text-teal-400 tracking-wider uppercase">Étape 2</span>
              </div>
              <h4 class="text-sm font-bold text-slate-200 mb-1">L'Écoute</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                L'extrait est diffusé en temps réel. Écoutez attentivement le style, le genre ou les paroles.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-purple-500/30 hover:-translate-y-0.5 transition-all duration-300 group">
              <div class="flex items-center gap-3 mb-2.5">
                <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-purple-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                  </svg>
                </div>
                <span class="text-xs font-black text-purple-400 tracking-wider uppercase">Étape 3</span>
              </div>
              <h4 class="text-sm font-bold text-slate-200 mb-1">Le Vote</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Accusez le suspect idéal ! Sélectionnez le joueur qui, selon vous, a proposé la musique en cours.
              </p>
            </div>

            <!-- Step 4 -->
            <div class="glass-card p-4 rounded-xl border border-slate-800/80 hover:border-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 group">
              <div class="flex items-center gap-3 mb-2.5">
                <div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-rose-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7Zm0 0v4m-4 0h8m-12-8h4m8 0h4" />
                  </svg>
                </div>
                <span class="text-xs font-black text-rose-400 tracking-wider uppercase">Étape 4</span>
              </div>
              <h4 class="text-sm font-bold text-slate-200 mb-1">Révélation</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Les coupables sont démasqués. Marquez des points bonus si personne ne vous a trouvé !
              </p>
            </div>
          </div>

          <!-- Interactive Game Simulator -->
          <div class="glass-panel p-5 rounded-2xl border border-purple-500/15 shadow-lg shadow-purple-500/2 hover:border-purple-500/30 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                Simuler un Tour <span class="text-purple-400">🎮</span>
              </h3>
              <button @click="resetMockGame" class="text-xs text-slate-400 hover:text-white underline transition-colors">Réinitialiser</button>
            </div>

            <!-- Simulator Body -->
            <div class="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-4">
              <!-- Animated Vinyl -->
              <div @click="mockPlaying = !mockPlaying" class="relative w-20 h-20 rounded-full flex-shrink-0 cursor-pointer select-none group" title="Cliquer pour jouer/pauser la simulation">
                <div :class="['absolute inset-0 bg-slate-950 rounded-full border-2 border-slate-800 flex items-center justify-center shadow-lg transition-transform duration-300', mockPlaying ? 'animate-spin-slow' : '']">
                  <!-- Grooves -->
                  <div class="w-16 h-16 rounded-full border border-slate-800/40 flex items-center justify-center">
                    <div class="w-10 h-10 rounded-full border border-slate-800/60 flex items-center justify-center">
                      <!-- Center Label -->
                      <div class="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Play/Pause Overlay -->
                <div class="absolute inset-0 bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <svg v-if="mockPlaying" class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <svg v-else class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              <!-- Track info and interactive soundwave -->
              <div class="flex-grow text-center sm:text-left">
                <div class="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Thème : Chanson de la honte</div>
                <div class="text-sm font-extrabold text-white flex flex-col sm:flex-row items-center gap-1.5 justify-center sm:justify-start">
                  <span>Morceau Mystère 📻</span>
                  <span class="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mt-1 sm:mt-0">Devinez l'auteur !</span>
                </div>
                
                <!-- Equalizer Soundwave -->
                <div class="flex items-end justify-center sm:justify-start gap-1 h-6 mt-3">
                  <div :class="['w-1 bg-cyan-400 rounded-full transition-all duration-300', mockPlaying ? 'animate-eq-1' : 'h-1.5']"></div>
                  <div :class="['w-1 bg-cyan-300 rounded-full transition-all duration-300', mockPlaying ? 'animate-eq-2' : 'h-3']"></div>
                  <div :class="['w-1 bg-teal-400 rounded-full transition-all duration-300', mockPlaying ? 'animate-eq-3' : 'h-1']"></div>
                  <div :class="['w-1 bg-purple-400 rounded-full transition-all duration-300', mockPlaying ? 'animate-eq-4' : 'h-2']"></div>
                  <div :class="['w-1 bg-purple-500 rounded-full transition-all duration-300', mockPlaying ? 'animate-eq-5' : 'h-1.5']"></div>
                </div>
              </div>
            </div>

            <!-- Choices list / Result -->
            <div v-if="!mockGuessed">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center sm:text-left">Qui est le coupable ? Accusez un joueur :</div>
              <div class="grid grid-cols-3 gap-2">
                <button @click="guessSuspect('Alice')" class="px-3 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/60 hover:border-cyan-500/30 rounded-xl text-xs sm:text-sm font-bold text-slate-200 transition-all active:scale-95">Alice 👩‍🦰</button>
                <button @click="guessSuspect('Bob')" class="px-3 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/60 hover:border-cyan-500/30 rounded-xl text-xs sm:text-sm font-bold text-slate-200 transition-all active:scale-95">Bob 🧔</button>
                <button @click="guessSuspect('Clara')" class="px-3 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/60 hover:border-cyan-500/30 rounded-xl text-xs sm:text-sm font-bold text-slate-200 transition-all active:scale-95">Clara 👩</button>
              </div>
            </div>

            <!-- Success / Error screen -->
            <div v-else class="mt-2">
              <Transition name="fade" mode="out-in">
                <div v-if="mockGuessed === 'success'" key="success" class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
                  <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0"/>
                    </svg>
                    <span>Bingo ! +100 points !</span>
                  </div>
                  <p class="text-xs text-emerald-300/80 leading-relaxed">
                    C'est bien Alice qui a proposé cette musique. Vous marquez 100 points et Alice ne marque aucun point de camouflage !
                  </p>
                  <button @click="resetMockGame" class="mt-2 self-start px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all active:scale-95">Recommencer</button>
                </div>

                <div v-else-if="mockGuessed === 'error'" key="error" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex flex-col gap-2">
                  <div class="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0"/>
                    </svg>
                    <span>Faux ! Ce n'est pas {{ mockSuspect }}.</span>
                  </div>
                  <p class="text-xs text-rose-300/80 leading-relaxed">
                    {{ mockSuspect }} sourit en coin ! Essayez d'analyser le style pour trouver qui a réellement soumis ce morceau.
                  </p>
                  <button @click="resetMockGame" class="mt-2 self-start px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black text-xs rounded-lg transition-all active:scale-95">Réessayer</button>
                </div>
              </Transition>
            </div>

          </div>

        </div>

        <!-- Right Column: Join/Create Session Forms (Order 1 on mobile, 2 on desktop) -->
        <div class="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2">
          
          <!-- Segmented Tab Switcher -->
          <div class="flex justify-center opacity-0 animate-fade-in-up" style="animation-delay: 0.05s;">
            <div class="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 flex gap-1.5 shadow-inner w-full sm:w-auto">
              <button 
                @click="activeAction = 'create'" 
                :class="['flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95', activeAction === 'create' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10' : 'text-slate-400 hover:text-slate-200']"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Créer un Salon
              </button>
              <button 
                @click="activeAction = 'join'" 
                :class="['flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95', activeAction === 'join' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' : 'text-slate-400 hover:text-slate-200']"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Rejoindre un Salon
              </button>
            </div>
          </div>

          <!-- Action Card Container -->
          <div class="opacity-0 animate-fade-in-up w-full max-w-md mx-auto" style="animation-delay: 0.15s;">
            <Transition name="fade" mode="out-in">
              <!-- Create Room Card -->
              <div v-if="activeAction === 'create'" key="create" class="glass-panel p-8 rounded-2xl shadow-xl flex flex-col justify-between border-cyan-500/20 shadow-cyan-500/2 hover:border-cyan-500/40 transition-all duration-300">
                <div>
                  <div class="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-white mb-2">Créer un Salon</h2>
                  <p class="text-slate-400 text-sm mb-6">
                    Devenez l'hôte de la partie, configurez les règles (nombre de musiques, timers, révélations) et invitez vos amis.
                  </p>
                </div>

                <form @submit.prevent="onCreate" class="space-y-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Votre Pseudo</label>
                    <input v-model="createName" required class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" placeholder="Pseudo de l'hôte" />
                  </div>
                  <button class="w-full glow-btn bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg transition-all">
                    Lancer le Salon
                  </button>
                </form>
              </div>

              <!-- Join Room Card -->
              <div v-else key="join" class="glass-panel p-8 rounded-2xl shadow-xl flex flex-col justify-between border-purple-500/20 shadow-purple-500/2 hover:border-purple-500/40 transition-all duration-300">
                <div>
                  <div class="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-white mb-2">Rejoindre un Salon</h2>
                  <p class="text-slate-400 text-sm mb-6">
                    Entrez le code de session à 6 caractères généré par l'hôte pour vous connecter instantanément.
                  </p>
                </div>

                <form @submit.prevent="onJoin" class="space-y-4">
                  <div class="grid grid-cols-3 gap-3">
                    <div class="col-span-1">
                      <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Code</label>
                      <input v-model="joinCode" required maxlength="6" class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-center font-mono uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="ABCDEF" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Votre Pseudo</label>
                      <input v-model="joinName" required class="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="Votre pseudo" />
                    </div>
                  </div>
                  <button class="w-full glow-btn-purple bg-purple-500 hover:bg-purple-400 text-white font-bold py-2.5 rounded-lg transition-all">
                    Rejoindre la Partie
                  </button>
                </form>
              </div>
            </Transition>
          </div>

          <!-- Error Feedback -->
          <p v-if="error" class="mt-2 text-center text-rose-400 text-sm font-semibold bg-rose-500/10 border border-rose-500/20 py-2.5 rounded-xl max-w-md mx-auto w-full">
            {{ error }}
          </p>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
const router = useRouter();

const activeAction = ref('create');
const createName = ref('');
const joinCode = ref('');
const joinName = ref('');
const error = ref(null);

// Mini-game Simulator state
const mockGuessed = ref(null);
const mockSuspect = ref('');
const mockPlaying = ref(true);

const resetMockGame = () => {
  mockGuessed.value = null;
  mockSuspect.value = '';
  mockPlaying.value = true;
};

const guessSuspect = (name) => {
  mockSuspect.value = name;
  if (name === 'Alice') {
    mockGuessed.value = 'success';
  } else {
    mockGuessed.value = 'error';
  }
};

const onCreate = async () => {
  error.value = null;
  try {
    const { session } = await store.createSession(createName.value);
    store.connectSocket(session.code);
    router.push(`/game/${session.code}`);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Erreur de création";
  }
};

const onJoin = async () => {
  error.value = null;
  const code = joinCode.value.trim().toUpperCase();
  try {
    await store.joinSession(code, joinName.value);
    store.connectSocket(code);
    router.push(`/game/${code}`);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Impossible de rejoindre";
  }
};
</script>

<style scoped>
/* Vue Transitions for switching active tabs */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
