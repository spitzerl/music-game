import { query } from '../config/database.js';
import Session from '../models/Session.js';
import Player from '../models/Player.js';
import Music from '../models/Music.js';

const VALID_PHASES = ['waiting', 'selection', 'voting', 'results'];

const BOT_TRACKS = [
  { title: "Blinding Lights", artist: "The Weeknd", file_path: "https://cdns-preview-e.dzcdn.net/stream/c-e12ac87d5b1b748f06f7ad86903f262b-6.mp3" },
  { title: "Shape of You", artist: "Ed Sheeran", file_path: "https://cdns-preview-d.dzcdn.net/stream/c-d232fb2ed0b90d8a297bdc07520e5883-6.mp3" },
  { title: "Dance Monkey", artist: "Tones and I", file_path: "https://cdns-preview-9.dzcdn.net/stream/c-97491cf2371c6cc49df244d2d4f29df5-6.mp3" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", file_path: "https://cdns-preview-b.dzcdn.net/stream/c-b716ca1d7d0a213e4b4cc8e11e03dfdc-6.mp3" },
  { title: "Bad Guy", artist: "Billie Eilish", file_path: "https://cdns-preview-5.dzcdn.net/stream/c-5cf29d2b2707248f7d93ebf4f58f4c54-6.mp3" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", file_path: "https://cdns-preview-7.dzcdn.net/stream/c-76a6b8f362de0b8dc77678f187a5dc07-6.mp3" },
  { title: "As It Was", artist: "Harry Styles", file_path: "https://cdns-preview-6.dzcdn.net/stream/c-6e6ad8f391b10a24ef7c075db3de07b6-6.mp3" },
  { title: "Perfect", artist: "Ed Sheeran", file_path: "https://cdns-preview-b.dzcdn.net/stream/c-b258cfb5a0fb70f20ee4b85c1f01dfdc-6.mp3" },
  { title: "Believer", artist: "Imagine Dragons", file_path: "https://cdns-preview-b.dzcdn.net/stream/c-b03f0b2fbc9e731b8ef51ef40d4f2dfc-6.mp3" },
  { title: "Levitating", artist: "Dua Lipa", file_path: "https://cdns-preview-8.dzcdn.net/stream/c-8a2bf6e1de0e6cc47de1328905f84b6f-6.mp3" },
  { title: "Dynamite", artist: "BTS", file_path: "https://cdns-preview-d.dzcdn.net/stream/c-db7ac87f8ce829a28e8dfdf163e070dc-6.mp3" },
  { title: "Shallow", artist: "Lady Gaga & Bradley Cooper", file_path: "https://cdns-preview-7.dzcdn.net/stream/c-7e6ac8786de8ec37efc77d079cf7e0dc-6.mp3" },
  { title: "Flowers", artist: "Miley Cyrus", file_path: "https://cdns-preview-f.dzcdn.net/stream/c-f232abce0ef87a8cdef132df05f8dfdc-6.mp3" },
  { title: "Starboy", artist: "The Weeknd", file_path: "https://cdns-preview-0.dzcdn.net/stream/c-0e2ac87e5b1b748f06f7ad86903f262b-6.mp3" },
  { title: "Save Your Tears", artist: "The Weeknd", file_path: "https://cdns-preview-3.dzcdn.net/stream/c-3f2ac87e5b1b748f06f7ad86903f262b-6.mp3" }
];

export default class GameService {
  constructor() {
    this.ioNamespace = null;
    this.activeTimers = new Map();
  }

  setIoNamespace(ioNamespace) {
    this.ioNamespace = ioNamespace;
  }

  async broadcastState(code) {
    if (!this.ioNamespace) return;
    try {
      const socketsInRoom = await this.ioNamespace.in(code).fetchSockets();
      await Promise.all(socketsInRoom.map(async (socket) => {
        try {
          const playerId = socket.playerId || null;
          const playerState = await this.getState(code, playerId);
          socket.emit('state:update', playerState);
        } catch (err) {
          // ignore socket emit error
        }
      }));
    } catch (err) {
      this.log(code, `Error in broadcasting state: ${err.message}`);
    }
  }

  log(code, message) {
    console.log(`[GAME LOG][${code}][${new Date().toISOString()}]: ${message}`);
  }

  // Timer Helper
  startTimer(code, durationSeconds, callback) {
    this.clearTimer(code);
    const delayMs = durationSeconds * 1000;
    const endsAt = new Date(Date.now() + delayMs);

    const timeoutId = setTimeout(async () => {
      this.activeTimers.delete(code);
      try {
        await callback();
      } catch (err) {
        this.log(code, `Error in timer callback: ${err.message}`);
      }
    }, delayMs);

    this.activeTimers.set(code, {
      timeoutId,
      endsAt,
      callback
    });

    return endsAt;
  }

  clearTimer(code) {
    if (this.activeTimers.has(code)) {
      clearTimeout(this.activeTimers.get(code).timeoutId);
      this.activeTimers.delete(code);
    }
  }

  async createSession(hostName) {
    const code = await Session.generateCode();
    const session = await Session.create({ code, hostName });
    const host = await Player.create({ sessionId: session.id, name: hostName });
    this.log(code, `Session created by host ${hostName}`);
    return { session, host };
  }

  async updateConfig(code, config) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'waiting' && (session.phase !== 'voting' || session.voting_status !== 'idle')) {
      throw new Error('Impossible de modifier les paramètres en cours de jeu');
    }
    const updated = await Session.updateConfig(code, config);
    this.log(code, `Configuration updated: ${JSON.stringify(config)}`);
    return this.getState(code);
  }

  async addBot(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'waiting') {
      throw new Error('Impossible d\'ajouter un bot après le début de la partie');
    }

    const players = await Player.findBySession(session.id);
    if (players.length >= session.max_players) {
      throw new Error('Nombre maximum de joueurs atteint');
    }

    const botCount = players.filter(p => p.is_bot).length;
    const botName = `Bot ${botCount + 1}`;
    const bot = await Player.create({ sessionId: session.id, name: botName, isBot: true });
    this.log(code, `Bot added: ${botName}`);
    return this.getState(code);
  }

  async joinSession(code, playerName) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'waiting') {
      throw new Error('La partie a déjà commencé');
    }

    const players = await Player.findBySession(session.id);
    if (players.length >= session.max_players) {
      throw new Error('La session est complète');
    }

    const player = await Player.create({ sessionId: session.id, name: playerName });
    this.log(code, `Player joined: ${playerName}`);
    return { session, player };
  }

  async addMusic(code, payload) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'selection') {
      throw new Error('La phase de sélection n\'est pas active');
    }

    // Check count of player's musics
    const musics = await Music.findBySession(session.id);
    const playerMusics = musics.filter(m => m.player_id === payload.playerId);
    if (playerMusics.length >= session.max_musics_per_player) {
      throw new Error(`Vous avez déjà ajouté le nombre maximum de musiques (${session.max_musics_per_player})`);
    }

    const music = await Music.create({ sessionId: session.id, ...payload });
    this.log(code, `Music added: ${payload.title} by player ${payload.playerId}`);
    return music;
  }

  async deleteMusic(code, musicId, playerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'selection') {
      throw new Error('Impossible de supprimer des musiques en dehors de la sélection');
    }
    const deleted = await Music.deleteMusic(musicId, playerId);
    if (!deleted) {
      throw new Error('Musique introuvable ou non autorisée');
    }
    this.log(code, `Music deleted: id ${musicId} by player ${playerId}`);
    return this.getState(code);
  }

  async startSelection(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'waiting') {
      throw new Error('La sélection a déjà démarré');
    }

    // Transition to selection
    await Session.updatePhase(code, 'selection');
    
    // Auto-generate music for bots
    const players = await Player.findBySession(session.id);
    const bots = players.filter(p => p.is_bot);
    for (const bot of bots) {
      // Pick random tracks
      const shuffledTracks = [...BOT_TRACKS].sort(() => Math.random() - 0.5);
      const limit = session.max_musics_per_player;
      for (let i = 0; i < limit; i++) {
        const track = shuffledTracks[i % shuffledTracks.length];
        
        let freshFilePath = track.file_path;
        try {
          const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}&limit=1`;
          const response = await fetch(searchUrl);
          if (response.ok) {
            const payload = await response.json();
            if (payload?.data?.[0]?.preview) {
              freshFilePath = payload.data[0].preview;
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch fresh preview for bot track: ${track.title}`, err);
        }

        await Music.create({
          sessionId: session.id,
          playerId: bot.id,
          title: track.title,
          artist: track.artist,
          filePath: freshFilePath
        });
      }
    }

    // Set selection timer
    const endsAt = this.startTimer(code, session.selection_duration, async () => {
      this.log(code, 'Selection timer finished, transitioning to voting');
      await this.startVoting(code);
    });

    await Session.updateVotingState(code, {
      currentMusicIndex: -1,
      votingStatus: 'idle',
      timerEndsAt: endsAt
    });

    this.log(code, 'Selection phase started');
    await this.broadcastState(code);
    if (this.ioNamespace) {
      this.ioNamespace.to(code).emit('sound:play', { type: 'phase_change' });
    }
    return this.getState(code);
  }

  async startVoting(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    // Clear selection timer just in case
    this.clearTimer(code);

    const players = await Player.findBySession(session.id);
    const musics = await Music.findBySession(session.id);

    // Identify players who have enough musics
    const minMusics = session.max_musics_per_player;
    const activeMusics = [];
    
    for (const player of players) {
      const pMusics = musics.filter(m => m.player_id === player.id);
      
      // If player is disconnected or doesn't have enough music, they become observers
      // Wait, if they are disconnected during selection, their musics are not counted.
      // But if they are connected, we check if they have enough musics.
      const hasEnough = pMusics.length >= minMusics;
      if (!player.is_connected || !hasEnough) {
        await Player.setObserver(player.id, true);
        this.log(code, `Player ${player.name} marked as observer (enough: ${hasEnough}, connected: ${player.is_connected})`);
      } else {
        await Player.setObserver(player.id, false);
        activeMusics.push(...pMusics);
      }
    }

    // Shuffle and save play order for musics
    const shuffledMusics = activeMusics.sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledMusics.length; i++) {
      await Music.updatePlayOrder(shuffledMusics[i].id, i);
    }

    // Clear previous votes
    await query('DELETE FROM votes WHERE session_id = $1', [session.id]);

    await Session.updatePhase(code, 'voting');

    if (shuffledMusics.length === 0) {
      this.log(code, 'No musics available, transitioning directly to results');
      return this.finishSession(code);
    }

    const initialStatus = session.auto_advance ? 'listening' : 'idle';
    this.log(code, `Voting phase started, entering first subphase: ${initialStatus}`);
    await this.enterVotingSubphase(code, 0, initialStatus);
  }

  async enterVotingSubphase(code, musicIndex, status) {
    const session = await Session.findByCode(code);
    if (!session) return;

    let duration = 0;
    if (status === 'listening') {
      duration = session.extract_duration;
    } else if (status === 'voting') {
      duration = session.voting_duration;
    } else if (status === 'revelation') {
      duration = 10; // Default revelation duration
    }

    this.clearTimer(code);

    let endsAt = null;
    if (duration > 0) {
      const callback = async () => {
        this.log(code, `Subphase timer finished for music index ${musicIndex}, status ${status}`);
        if (status === 'listening') {
          // Transition to voting
          await this.enterVotingSubphase(code, musicIndex, 'voting');
        } else if (status === 'voting') {
          // Transition to revelation or next music
          if (session.show_answers) {
            await this.enterVotingSubphase(code, musicIndex, 'revelation');
          } else {
            await this.nextRound(code, musicIndex);
          }
        } else if (status === 'revelation') {
          // Transition to next music
          await this.nextRound(code, musicIndex);
        }
      };
      endsAt = this.startTimer(code, duration, callback);
    }

    const updatedSession = await Session.updateVotingState(code, {
      currentMusicIndex: musicIndex,
      votingStatus: status,
      timerEndsAt: endsAt
    });

    await this.broadcastState(code);

    if (this.ioNamespace) {
      if (status === 'listening') {
        this.ioNamespace.to(code).emit('sound:play', { type: 'phase_change' });
      } else if (status === 'voting') {
        // Trigger bot votes automatically after a random delay
        this.triggerBotVotes(code, musicIndex);
      } else if (status === 'revelation') {
        this.ioNamespace.to(code).emit('sound:play', { type: 'vote_closed' });
      }
    }
  }

  async nextRound(code, currentIndex) {
    const session = await Session.findByCode(code);
    if (!session) return;

    const musics = await Music.findBySession(session.id);
    const activeMusics = musics.filter(m => m.play_order >= 0);
    const nextIndex = currentIndex + 1;

    if (nextIndex < activeMusics.length) {
      const nextStatus = session.auto_advance ? 'listening' : 'idle';
      await this.enterVotingSubphase(code, nextIndex, nextStatus);
    } else {
      await this.finishSession(code);
    }
  }

  async startRound(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'voting' || session.voting_status !== 'idle') {
      throw new Error('Impossible de lancer la manche depuis ce statut');
    }
    await this.enterVotingSubphase(code, session.current_music_index, 'listening');
    return this.getState(code);
  }

  async triggerBotVotes(code, musicIndex) {
    const session = await Session.findByCode(code);
    if (!session) return;

    const players = await Player.findBySession(session.id);
    const musics = await Music.findBySession(session.id);
    const currentMusic = musics.find(m => m.play_order === musicIndex);
    if (!currentMusic) return;

    const bots = players.filter(p => p.is_bot && !p.is_observer && p.is_connected);
    const eligibleTargets = players.filter(p => !p.is_observer);

    for (const bot of bots) {
      // Choose random player except themselves
      const targets = eligibleTargets.filter(t => t.id !== bot.id);
      if (targets.length === 0) continue;

      const chosenTarget = targets[Math.floor(Math.random() * targets.length)];
      const randomDelay = Math.random() * session.voting_duration * 1000 * 0.8;

      setTimeout(async () => {
        try {
          // Verify session state before voting
          const freshSession = await Session.findByCode(code);
          if (freshSession.phase === 'voting' && freshSession.voting_status === 'voting' && freshSession.current_music_index === musicIndex) {
            await this.submitVote(code, bot.id, currentMusic.id, chosenTarget.id);
          }
        } catch (err) {
          // Bot vote failed (e.g. state already changed), ignore
        }
      }, randomDelay);
    }
  }

  async submitVote(code, voterId, musicId, guessedPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'voting') {
      throw new Error('La phase de vote n\'est pas active');
    }

    if (session.voting_status !== 'voting') {
      throw new Error('Les votes sont fermés pour ce morceau');
    }

    // Check if voter is observer
    const players = await Player.findBySession(session.id);
    const voter = players.find(p => p.id === voterId);
    if (!voter || voter.is_observer) {
      throw new Error('Vous êtes observateur et ne pouvez pas voter');
    }

    const music = await Music.findById(musicId);
    if (!music || music.session_id !== session.id) {
      throw new Error('Musique invalide');
    }

    // Check if timer expired
    if (session.timer_ends_at && new Date() > new Date(session.timer_ends_at)) {
      throw new Error('Le temps est écoulé pour ce vote');
    }

    // Validate vote
    if (voterId === guessedPlayerId) {
      throw new Error('Vous ne pouvez pas voter pour vous-même');
    }

    await query(
      `INSERT INTO votes (session_id, voter_id, music_id, guessed_player_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, voter_id, music_id)
       DO UPDATE SET guessed_player_id = EXCLUDED.guessed_player_id`,
      [session.id, voterId, musicId, guessedPlayerId]
    );

    this.log(code, `Vote submitted: player ${voterId} voted for player ${guessedPlayerId} on music ${musicId}`);

    await this.broadcastState(code);
    if (this.ioNamespace) {
      this.ioNamespace.to(code).emit('vote:submit', { voterId, musicId, guessedPlayerId });
    }
    return this.getState(code, voterId);
  }

  async finishSession(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    this.clearTimer(code);
    await Session.updatePhase(code, 'results');
    await Session.updateVotingState(code, {
      currentMusicIndex: -1,
      votingStatus: 'idle',
      timerEndsAt: null
    });

    // Save final calculated scores to DB for consistency
    const results = await this.getResults(code);
    for (const player of results.ranking) {
      await query('UPDATE players SET score = $1 WHERE id = $2', [player.score, player.id]);
    }

    this.log(code, 'Session finished');
    await this.broadcastState(code);
    if (this.ioNamespace) {
      this.ioNamespace.to(code).emit('sound:play', { type: 'game_ended' });
    }
    return results;
  }

  async resetSession(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    this.clearTimer(code);
    await Session.reset(code);
    await Player.resetScoresAndStatusBySession(session.id);
    await Music.deleteAllBySession(session.id);

    this.log(code, 'Session reset');
    await this.broadcastState(code);
    if (this.ioNamespace) {
      this.ioNamespace.to(code).emit('sound:play', { type: 'phase_change' });
    }
    return this.getState(code);
  }

  async getState(code, playerId = null) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const players = await Player.findBySession(session.id);
    const rawMusics = await Music.findBySession(session.id);
    const votes = await query('SELECT * FROM votes WHERE session_id = $1', [session.id]).then(res => res.rows);

    // Compute dynamic scores
    const playerMap = new Map(players.map(p => [p.id, {
      ...p,
      score: 0,
      votesReceived: 0,
      correctGuesses: 0
    }]));

    const musicProposers = new Map(rawMusics.map(m => [m.id, m.player_id]));

    for (const vote of votes) {
      const proposerId = musicProposers.get(vote.music_id);
      
      // Skip proposer's vote from scoring as it is just bluff
      if (vote.voter_id === proposerId) {
        continue;
      }

      const guessed = playerMap.get(vote.guessed_player_id);
      if (guessed) {
        guessed.votesReceived += 1;
      }

      if (proposerId && vote.guessed_player_id === proposerId) {
        const voter = playerMap.get(vote.voter_id);
        if (voter) {
          voter.correctGuesses += 1;
        }
      }
    }

    for (const p of playerMap.values()) {
      p.score = p.votesReceived * 1 + p.correctGuesses * 2;
    }

    // Sort players in the ranking list: highest score first, then order of arrival (created_at)
    const computedPlayers = Array.from(playerMap.values()).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });

    // Filter musics depending on phase to prevent cheating
    let filteredMusics = [];
    let currentMusic = null;
    let votesForCurrentMusic = [];

    if (session.phase === 'selection') {
      // During selection, players only see their own musics.
      // We also return a summary of music counts for all players
      const musicCounts = {};
      players.forEach(p => {
        musicCounts[p.id] = rawMusics.filter(m => m.player_id === p.id).length;
      });

      const parsedPlayerId = playerId ? Number.parseInt(playerId, 10) : null;
      const playerSelf = parsedPlayerId ? computedPlayers.find(p => p.id === parsedPlayerId) || null : null;

      if (playerId) {
        const targetId = Number.parseInt(playerId, 10);
        filteredMusics = rawMusics.filter(m => m.player_id === targetId);
      }

      return {
        session,
        players: computedPlayers,
        musics: filteredMusics,
        musicCounts,
        player: playerSelf
      };
    } else if (session.phase === 'voting') {
      // Return only the current music, play order
      const currentTrack = rawMusics.find(m => m.play_order === session.current_music_index);
      if (currentTrack) {
        currentMusic = { ...currentTrack };
        
        // Hide proposer (player_id) unless we are in the revelation subphase AND show_answers is true
        const isReveal = session.voting_status === 'revelation' && session.show_answers;
        if (!isReveal) {
          delete currentMusic.player_id;
        }

        // Return votes for the current track
        const currentVotes = votes.filter(v => v.music_id === currentMusic.id);
        
        if (session.voting_status === 'voting') {
          // During voting, return vote counts received by each player, but mask who voted for whom
          const voteCounts = {};
          players.forEach(p => { voteCounts[p.id] = 0; });
          currentVotes.forEach(v => {
            if (voteCounts[v.guessed_player_id] !== undefined) {
              voteCounts[v.guessed_player_id]++;
            }
          });
          votesForCurrentMusic = voteCounts;
        } else if (session.voting_status === 'revelation' && session.show_answers) {
          // During revelation, show full details of who guessed what
          votesForCurrentMusic = currentVotes;
        }
      }

      // Hide all player musics during voting phase to prevent cheat
      return {
        session,
        players: computedPlayers,
        currentMusic,
        votes: votesForCurrentMusic
      };
    } else if (session.phase === 'results') {
      // Reveal everything
      return {
        session,
        players: computedPlayers,
        musics: rawMusics,
        votes
      };
    }

    // waiting phase
    const parsedPlayerIdWaiting = playerId ? Number.parseInt(playerId, 10) : null;
    const playerSelfWaiting = parsedPlayerIdWaiting ? computedPlayers.find(p => p.id === parsedPlayerIdWaiting) || null : null;
    return {
      session,
      players: computedPlayers,
      musics: rawMusics,
      player: playerSelfWaiting
    };
  }

  async getResults(code) {
    const state = await this.getState(code);
    return {
      ...state,
      ranking: state.players
    };
  }

  async promotePlayer(code, requesterId, targetPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) throw new Error('Session introuvable');

    const players = await Player.findBySession(session.id);
    const requester = players.find(p => p.id === requesterId);
    if (!requester || requester.name !== session.host_name) {
      throw new Error('Seul l\'hôte actuel peut promouvoir un autre joueur');
    }

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) throw new Error('Joueur cible introuvable');
    if (targetPlayer.is_bot) throw new Error('Impossible de promouvoir un bot');

    await query(
      'UPDATE sessions SET host_name = $1, updated_at = NOW() WHERE code = $2',
      [targetPlayer.name, code]
    );

    this.log(code, `Host promoted: ${targetPlayer.name}`);
    await this.broadcastState(code);
    return this.getState(code, requesterId);
  }

  async kickPlayer(code, requesterId, targetPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) throw new Error('Session introuvable');

    const players = await Player.findBySession(session.id);
    const requester = players.find(p => p.id === requesterId);
    if (!requester || requester.name !== session.host_name) {
      throw new Error('Seul l\'hôte actuel peut kick un joueur');
    }

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) throw new Error('Joueur cible introuvable');

    if (targetPlayer.name === session.host_name) {
      throw new Error('L\'hôte ne peut pas se kick lui-même. Transférez d\'abord le rôle d\'hôte.');
    }

    // Disconnect socket for the kicked player
    if (this.ioNamespace) {
      const sockets = await this.ioNamespace.in(code).fetchSockets();
      const targetSockets = sockets.filter(s => s.playerId === targetPlayerId);
      for (const s of targetSockets) {
        s.emit('player:kicked');
        s.disconnect(true);
      }
    }

    // Delete player (ON DELETE CASCADE will clean up musics/votes)
    await Player.deletePlayer(targetPlayerId);

    this.log(code, `Player kicked: ${targetPlayer.name}`);

    // If the game is in selection or voting, adjust music play orders
    const remainingMusics = await Music.findBySession(session.id);
    if (session.phase === 'voting' && remainingMusics.length > 0) {
      remainingMusics.sort((a, b) => a.play_order - b.play_order);
      for (let index = 0; index < remainingMusics.length; index++) {
        await query('UPDATE musics SET play_order = $1 WHERE id = $2', [index, remainingMusics[index].id]);
      }
      
      if (session.current_music_index >= remainingMusics.length) {
        await this.finishSession(code);
      }
    } else if (session.phase === 'voting' && remainingMusics.length === 0) {
      await this.finishSession(code);
    }

    await this.broadcastState(code);
    return this.getState(code, requesterId);
  }

  async recoverSessions() {
    try {
      const activeSessions = await query(
        `SELECT * FROM sessions 
         WHERE phase IN ('selection', 'voting') 
           AND timer_ends_at IS NOT NULL`
      ).then(res => res.rows);

      for (const session of activeSessions) {
        const code = session.code;
        const endsAtTime = new Date(session.timer_ends_at).getTime();
        const nowTime = Date.now();
        const remainingSeconds = Math.max(0, Math.round((endsAtTime - nowTime) / 1000));

        this.log(code, `Recovering session phase: ${session.phase}, remaining seconds: ${remainingSeconds}`);

        if (session.phase === 'selection') {
          this.startTimer(code, remainingSeconds, async () => {
            this.log(code, 'Recovered selection timer finished, transitioning to voting');
            await this.startVoting(code);
          });
        } else if (session.phase === 'voting') {
          const index = session.current_music_index;
          const status = session.voting_status;
          
          this.startTimer(code, remainingSeconds, async () => {
            this.log(code, `Recovered timer finished for music index ${index}, status ${status}`);
            if (status === 'listening') {
              await this.enterVotingSubphase(code, index, 'voting');
            } else if (status === 'voting') {
              if (session.show_answers) {
                await this.enterVotingSubphase(code, index, 'revelation');
              } else {
                await this.nextRound(code, index);
              }
            } else if (status === 'revelation') {
              await this.nextRound(code, index);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error recovering active sessions:', err);
    }
  }
}
