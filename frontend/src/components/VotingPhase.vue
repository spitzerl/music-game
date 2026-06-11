<template>
  <div class="min-h-screen p-6 pb-24 max-w-7xl mx-auto flex flex-col justify-start gap-4 opacity-0 animate-fade-in-up">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
      <div class="flex justify-between items-center w-full sm:w-auto">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>{{ status === 'revelation' ? 'Révélation' : 'Phase de Vote' }}</span>
          </h1>
          <p class="text-slate-400 text-sm mt-0.5">
            Morceau <span class="text-cyan-400 font-bold font-mono">{{ (store.session?.current_music_index || 0) + 1 }}</span>
          </p>
        </div>
        <!-- Mobile Timer (Compact) -->
        <div v-if="status !== 'idle'" :class="['flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-base transition-all duration-300', remainingTime < 10 ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-cyan-400']">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="font-mono text-sm">{{ remainingTime }}s</span>
        </div>
      </div>

      <!-- Header Action Controls -->
      <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <!-- Host Skip/Next Subphase Button -->
        <button
          v-if="isHost && status === 'voting'"
          @click="advanceSubphase"
          :class="['flex-1 sm:flex-none px-3.5 py-2 border text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95', everyoneHasVoted ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200']"
        >
          <span>Révéler ({{ totalVotesCast }}/{{ totalEligibleVoters }})</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <!-- Host Manage Players Button -->
        <button v-if="isHost" @click="showPlayersModal = true" class="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
          ⚙️ <span>Gérer les joueurs</span>
        </button>

        <!-- Desktop Timer -->
        <div v-if="status !== 'idle'" :class="['hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-lg transition-all duration-300', remainingTime < 10 ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-cyan-400']">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="font-mono">{{ remainingTime }}s</span>
        </div>
      </div>
    </header>

    <!-- First Round Start Screen -->
    <main v-if="status === 'idle'" class="flex flex-col items-center justify-center min-h-[500px] lg:min-h-[600px] w-full relative z-10 mb-8">
      <div class="glass-panel p-8 md:p-12 text-center rounded-3xl border border-slate-800 shadow-2xl max-w-3xl w-full mx-auto relative overflow-hidden flex flex-col justify-center items-center">
        <!-- Background Glow -->
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider mb-6 relative z-10">
          Préparation de la manche 1
        </div>

        <h2 class="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-lg relative z-10">La partie va commencer !</h2>
        <p class="text-lg md:text-xl text-slate-300 font-medium mb-12 relative z-10 max-w-xl mx-auto">
          La phase de sélection est terminée.<br/>
          Écoutez attentivement chaque morceau et devinez quel joueur l'a proposé.
        </p>
        
        <div v-if="isHost" class="relative z-10 w-full">
          <button @click="launchRound" class="glow-btn-cyan bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 px-10 md:py-5 md:px-12 rounded-2xl transition-all flex items-center justify-center gap-3 mx-auto text-xl md:text-2xl shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Commencer la partie
          </button>
        </div>
        <div v-else class="space-y-4 relative z-10">
          <div class="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 w-full max-w-md mx-auto">
            <span class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></span>
            <span class="font-bold text-base md:text-lg">En attente de l'hôte pour commencer...</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Main Board (Subsequent phases) -->
    <main v-else class="grid md:grid-cols-2 gap-6 mb-8 items-stretch">
      <!-- Status Box -->
      <section class="glass-panel p-4 md:p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-0 py-8 md:min-h-[500px] lg:min-h-[600px]">

        <!-- Listening Phase -->
        <div v-if="status === 'listening'" class="space-y-6">
          <!-- Animated soundwave (Equalizer) -->
          <div class="flex items-end justify-center gap-2 h-16 mb-4 w-40 mx-auto px-4 py-2">
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
          
          <!-- Audio helper info -->
          <div class="flex flex-col items-center gap-2 mt-4">
            <div v-if="audioError" class="px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse max-w-sm mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Impossible de charger ou lire le son (bloqué ou expiré).
            </div>
            <button @click="retryAudio" class="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-all shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Relancer l'extrait audio
            </button>
          </div>
        </div>

        <!-- Voting Phase -->
        <div v-else-if="status === 'voting'" class="space-y-4 w-full">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            Vote Ouvert
          </div>
          <h2 class="text-3xl font-extrabold text-white">Qui a proposé ce morceau ?</h2>
          
          <!-- Track details revealed -->
          <div class="max-w-md mx-auto flex items-center gap-4 text-left py-2">
            <img v-if="store.currentMusic?.cover_url" :src="store.currentMusic.cover_url" class="w-16 h-16 rounded-xl object-cover shadow-xl border border-slate-800/60 flex-shrink-0" />
            <div v-else class="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xl flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6C19 6 13 12 13 12v6.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="font-extrabold text-white text-lg truncate">{{ store.currentMusic?.title }}</p>
              <p class="text-slate-400 text-sm truncate mt-0.5">{{ store.currentMusic?.artist }}</p>
            </div>
          </div>

          <!-- Audio helper info -->
          <div class="flex flex-col items-center gap-2 mt-4">
            <div v-if="audioError" class="px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse max-w-sm mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Impossible de charger ou lire le son (bloqué ou expiré).
            </div>
            <button @click="retryAudio" class="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-all shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Relancer l'extrait audio
            </button>
          </div>
        </div>

        <!-- Revelation Phase & Blind Test Revelation -->
        <div v-else-if="status === 'revelation'" class="w-full flex-1 flex flex-col items-center justify-center py-2 relative">
          <!-- Glass Card Container -->
          <div class="relative w-full max-w-sm bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-3.5 sm:p-5 flex flex-col items-center text-center overflow-hidden">
            
            <!-- Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none"></div>

            <!-- Compact cover art on mobile -->
            <div class="relative group mb-3 sm:mb-4 z-10">
              <img v-if="store.currentMusic?.cover_url" :src="store.currentMusic.cover_url" class="w-24 h-24 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-xl sm:rounded-2xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700/80 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-1" />
              <div v-else class="w-24 h-24 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700/80">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 sm:w-14 sm:h-14 opacity-80">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6C19 6 13 12 13 12v6.75m0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>

            <!-- Song info (smaller font on mobile) -->
            <div class="z-10 w-full mb-2 sm:mb-3">
              <h3 class="text-base sm:text-xl md:text-2xl font-black text-white leading-tight truncate max-w-full drop-shadow-md">{{ store.currentMusic?.title }}</h3>
              <p class="text-xs sm:text-sm md:text-base text-cyan-400/80 font-bold truncate max-w-full mt-0.5 sm:mt-1 drop-shadow">{{ store.currentMusic?.artist }}</p>
            </div>

            <!-- Proposer (More compact on mobile) -->
            <div v-if="status === 'revelation'" class="z-10 w-full bg-slate-950/40 rounded-xl p-1.5 sm:p-2.5 border border-slate-800/60 mb-2 sm:mb-3 flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow-inner">
              <span class="text-[9px] sm:text-[10px] text-yellow-500/80 uppercase font-black tracking-widest">Proposé par</span>
              <div class="flex items-center gap-2 mt-1">
                <img v-if="proposerPlayer?.avatar_seed" :src="`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${proposerPlayer.avatar_seed}`" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-yellow-500/30 bg-slate-800 shadow-md flex-shrink-0" alt="Avatar" />
                <span class="text-lg sm:text-xl md:text-2xl font-black text-yellow-400 tracking-wide animate-pulse drop-shadow-md">{{ proposerName }}</span>
              </div>
            </div>

            <!-- Personal Results (Smaller badges on mobile) -->
            <div v-if="!isObserver && status === 'revelation'" class="z-10 w-full mt-1 sm:mt-2 flex flex-col gap-1.5 sm:gap-2">
              <div v-if="store.session?.enable_blind_test && myBlindTestResult" :class="['px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg', myBlindTestResult.statusClass]">
                BLIND TEST : {{ myBlindTestResult.statusLabel }}
              </div>
              <div v-if="myVoteResult" :class="['px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg', myVoteResult.statusClass]">
                VOTE : {{ myVoteResult.statusLabel }}
              </div>
            </div>
          </div>

          <!-- Host: advance to next round (Less margin on mobile) -->
          <div v-if="isHost && status === 'revelation'" class="mt-4 sm:mt-6 z-10">
            <button @click="advanceFromRevelation" class="glow-btn-purple bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 px-6 sm:py-3.5 sm:px-8 rounded-2xl transition-all flex items-center gap-2 text-sm sm:text-base shadow-[0_0_20px_rgba(147,51,234,0.4)] active:scale-98">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 sm:w-5 sm:h-5">
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
      <section class="glass-panel p-4 md:p-6 rounded-2xl border border-slate-800 min-h-0 md:min-h-[500px] lg:min-h-[600px] h-full flex flex-col overflow-hidden">
        <!-- Voting Active -->
        <div v-if="status === 'voting'" class="flex flex-col h-full space-y-4">
          <!-- Proposer Message -->
          <div v-if="isProposer" class="text-center py-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-purple-400 font-medium text-sm">
            📢 Vous avez proposé ce morceau. Votre vote sert uniquement à bluffer les autres joueurs !
          </div>
          <!-- Observer Message -->
          <div v-else-if="isObserver" class="text-center py-6 bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-slate-400 italic text-sm">
            Vous êtes spectateur de cette partie. Observez les votes en direct !
          </div>

          <!-- Voter Buttons Grid -->
          <div v-if="!isObserver" class="flex flex-col flex-1 min-h-0 space-y-3">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex-shrink-0">Sélectionnez le suspect :</p>
            <TransitionGroup
              name="list"
              tag="div"
              class="grid grid-cols-2 gap-3 md:gap-4 overflow-y-auto p-3 -mx-3"
            >
              <button
                v-for="target in eligiblePlayers"
                :key="target.id"
                @click="castVote(target.id)"
                :disabled="target.id === store.player?.id"
                :class="['p-5 rounded-2xl border text-left font-bold transition-all flex justify-between items-center text-base md:text-lg min-h-[64px]', selectedVoteId === target.id ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white', target.id === store.player?.id ? 'opacity-50 cursor-not-allowed hover:border-slate-800 hover:text-slate-300 hover:scale-100 active:scale-100' : 'active:scale-[0.98] hover:scale-[1.01]']"
              >
                <div class="flex items-center gap-3 truncate pr-2">
                  <img v-if="target.avatar_seed" :src="`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${target.avatar_seed}`" class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-700/50 bg-slate-800/80 flex-shrink-0" alt="Avatar" />
                  <span class="truncate">{{ target.name }}</span>
                </div>
                <!-- Vote Counter -->
                <span v-if="store.session?.show_vote_count && getVoteCountForPlayer(target.id) > 0" class="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[11px] bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 font-bold animate-pulse-glow">
                  {{ getVoteCountForPlayer(target.id) }}
                </span>
              </button>
            </TransitionGroup>
          </div>
        </div>

        <!-- Revelation Details -->
        <div v-else-if="status === 'revelation'" class="flex flex-col h-full space-y-4">
          <h3 class="text-lg font-bold text-white mb-4 flex-shrink-0">Détail des votes</h3>
          <div class="space-y-2 flex-1 overflow-y-auto pr-2 pb-2">
            <div v-for="result in voteResults" :key="result.player.id" class="flex items-center justify-between py-3.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/10 transition-all px-2 rounded-xl">
              <div class="flex items-center gap-2">
                <img v-if="result.player.avatar_seed" :src="`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${result.player.avatar_seed}`" class="w-6 h-6 rounded-full border border-slate-700/50 bg-slate-800 flex-shrink-0" alt="Avatar" />
                <span class="font-bold text-slate-200 text-sm">{{ result.player.name }}</span>
                <template v-if="result.vote">
                  <span class="text-xs text-slate-500">pense que c'est</span>
                  <span class="font-bold text-slate-200 text-sm">{{ getPlayerName(result.vote.guessed_player_id) }}</span>
                </template>
                <template v-else>
                  <span class="text-xs text-slate-500 italic">n'a pas pu se décider</span>
                </template>
              </div>
              
              <!-- Success / Failure / Bluff / Missing Badge -->
              <span :class="['text-[10px] px-2 py-0.5 rounded border font-bold uppercase', result.statusClass]">
                {{ result.statusLabel }}
              </span>
            </div>
            <p v-if="!voteResults?.length" class="text-xs text-slate-500 italic text-center py-4">Aucun joueur pour cette manche.</p>
          </div>
        </div>



        <div v-else-if="status === 'listening'" class="h-full flex flex-col justify-center">
          <div v-if="!store.session?.enable_blind_test" class="text-center text-slate-500 italic text-sm">
            Les options de vote apparaîtront dès la fin de l'écoute.
          </div>
          <div v-else-if="!isObserver" class="flex flex-col h-full space-y-4 pt-4">
            <div v-if="isProposer" class="text-center py-2.5 bg-purple-500/10 border border-purple-500/20 px-4 rounded-xl text-purple-400 font-medium text-xs mb-2">
              📢 C'est votre morceau ! Vous ne participez pas au Blind Test.
            </div>
            <p v-else class="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 text-center flex-shrink-0">Blind Test : Quel est ce morceau ?</p>
            <TransitionGroup name="list" tag="div" class="grid grid-cols-2 gap-3 md:gap-4 overflow-y-auto p-3 -mx-3">
              <button
                v-for="(option, index) in blindTestOptions"
                :key="index"
                @click="submitBlindTestAnswer(option)"
                :disabled="hasAnsweredBlindTest || isProposer"
                :class="getBlindTestOptionClass(option)"
              >
                <span class="font-extrabold text-sm md:text-base line-clamp-1 w-full">{{ option.title }}</span>
                <span class="text-xs text-slate-400 line-clamp-1 w-full mt-1">{{ option.artist }}</span>
              </button>
            </TransitionGroup>
          </div>
          <div v-else class="text-center text-slate-500 italic text-sm">
            Mode Blind Test en cours pour les joueurs...
          </div>
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
const audioError = ref(false);
const volume = ref(localStorage.getItem('cekikilami_volume') ? Number(localStorage.getItem('cekikilami_volume')) : 0.5);

// Blind Test State
const blindTestSelectedAnswer = ref(null);
const hasAnsweredBlindTest = computed(() => blindTestSelectedAnswer.value !== null);

const blindTestOptions = computed(() => {
  if (!store.currentMusic || !store.currentMusic.blind_test_options) return [];
  try {
    return typeof store.currentMusic.blind_test_options === 'string' ? JSON.parse(store.currentMusic.blind_test_options) : store.currentMusic.blind_test_options;
  } catch (e) {
    return [];
  }
});

const blindTestResult = computed(() => {
  if (!store.currentMusic || !store.currentMusic.blind_test_answers || !store.player) return null;
  const answer = store.currentMusic.blind_test_answers.find(a => a.player_id === store.player.id);
  return answer || null;
});

const submitBlindTestAnswer = async (option) => {
  if (isObserver.value || status.value !== 'listening' || hasAnsweredBlindTest.value) return;
  blindTestSelectedAnswer.value = option;
  try {
    await store.submitBlindTestAnswer(store.currentMusic.id, option.title, option.artist);
  } catch (err) {
    console.error("Failed to submit blind test answer:", err);
    blindTestSelectedAnswer.value = null; // Revert on error
  }
};

const getBlindTestOptionClass = (option) => {
  const baseClasses = 'p-4 rounded-2xl border text-left transition-all flex flex-col justify-center items-center text-center min-h-[80px]';
  
  if (isProposer.value) {
    return `${baseClasses} opacity-50 cursor-not-allowed bg-slate-900/40 border-slate-800 text-slate-500`;
  }
  
  if (!hasAnsweredBlindTest.value) {
    return `${baseClasses} bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:scale-[1.02]`;
  }
  
  // Has answered
  const isSelected = blindTestSelectedAnswer.value?.title === option.title && blindTestSelectedAnswer.value?.artist === option.artist;
  
  if (isSelected) {
    if (blindTestResult.value) {
      if (blindTestResult.value.is_correct) {
        return `${baseClasses} bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20 scale-105`;
      } else {
        return `${baseClasses} bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/20 scale-105`;
      }
    }
    // Optimistic state before server response
    return `${baseClasses} bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105`;
  } else {
    // Unselected options after answering
    return `${baseClasses} opacity-50 cursor-not-allowed bg-slate-900/40 border-slate-800 text-slate-500`;
  }
};

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
  if (!store.currentMusic) return false;
  if (store.currentMusic.is_proposer !== undefined) return store.currentMusic.is_proposer;
  // Fallback for older states
  if (store.musics && store.musics.length > 0) {
    return store.musics.some(m => m.file_path === store.currentMusic.file_path || (m.title === store.currentMusic.title && m.artist === store.currentMusic.artist));
  }
  return false;
});

const eligiblePlayers = computed(() => {
  if (!store.players) return [];
  // Return all active players, sorted alphabetically
  return store.players
    .filter(p => !p.is_observer)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
});

const voteResults = computed(() => {
  if (!eligiblePlayers.value) return [];
  return eligiblePlayers.value.map(player => {
    const vote = store.votes?.find(v => v.voter_id === player.id);
    const isProposer = player.id === store.currentMusic?.player_id;
    let statusLabel = '';
    let statusClass = '';
    
    if (isProposer) {
      statusLabel = 'BLUFF';
      statusClass = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    } else if (!vote) {
      statusLabel = "N'a pas voté";
      statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else if (vote.guessed_player_id === store.currentMusic?.player_id) {
      statusLabel = '✓ Correct +1';
      statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else {
      statusLabel = '✗ Incorrect';
      statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }

    return {
      player,
      vote,
      isProposer,
      statusLabel,
      statusClass
    };
  });
});

const myVoteResult = computed(() => {
  if (!store.player) return null;
  return voteResults.value.find(r => r.player.id === store.player.id) || null;
});

const myBlindTestResult = computed(() => {
  if (!store.session?.enable_blind_test || !store.player) return null;
  
  let statusLabel = '';
  let statusClass = '';
  
  if (isProposer.value) {
    statusLabel = 'NE PARTICIPE PAS';
    statusClass = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  } else if (!blindTestResult.value) {
    statusLabel = "N'a pas répondu";
    statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (blindTestResult.value.is_correct) {
    statusLabel = '✓ Correct +1';
    statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else {
    statusLabel = '✗ Incorrect';
    statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  return { statusLabel, statusClass };
});

const proposerPlayer = computed(() => {
  if (!store.currentMusic || !store.currentMusic.player_id) return null;
  return store.players.find(p => p.id === store.currentMusic.player_id) || null;
});

const proposerName = computed(() => {
  const p = proposerPlayer.value;
  return p ? p.name : 'Inconnu';
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
  if (path.startsWith('http://')) {
    return path.replace('http://', 'https://');
  }
  if (path.startsWith('https://')) return path;
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
  audioError.value = false;
  if (audio) {
    audio.pause();
  }
  
  if (store.currentMusic?.file_path) {
    const url = formatAudioUrl(store.currentMusic.file_path);
    audio = new Audio(url);
    audio.volume = volume.value;
    
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      audioError.value = true;
    };
    
    if (status.value === 'listening') {
      audio.play().catch(err => {
        console.warn("Autoplay was blocked or audio failed:", err);
        if (err.name !== 'NotAllowedError') {
          audioError.value = true;
        }
      });
    }
  }
};

const retryAudio = () => {
  audioError.value = false;
  if (audio) {
    audio.play().catch(err => {
      console.error("Manual replay failed:", err);
      audioError.value = true;
    });
  } else {
    startAudio();
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
  blindTestSelectedAnswer.value = null; // reset blind test selection
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
