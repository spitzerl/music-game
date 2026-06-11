import { query } from '../config/database.js';
import Session from '../models/Session.js';
import Player from '../models/Player.js';
import Music from '../models/Music.js';

const VALID_PHASES = ['waiting', 'selection', 'voting', 'results'];

const normalizeTitle = (t) => {
  if (!t) return '';
  return t
    .toLowerCase()
    .replace(/\s+f(ea)?t(\.?\s+|\s+).*$/gi, '')
    .replace(/\s*[\(\[-].*$/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const BOT_NAMES_POOL = [
  'Lucas', 'Hugo', 'Arthur', 'Thomas', 'Léa', 'Camille', 'Manon', 'Chloé', 'Emma', 'Nathan',
  'Enzo', 'Louis', 'Clara', 'Sarah', 'Inès', 'Maëlys', 'Jade', 'Léo', 'Gabriel', 'Paul',
  'Maxime', 'Julien', 'Antoine', 'Nicolas', 'Marie', 'Julie', 'Sophie', 'Alexandre', 'Adrien', 'Elisa'
];

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

    // Choose a unique real name for the bot from the pool
    const existingNames = new Set(players.map(p => p.name.toLowerCase()));
    let botName = '';
    
    const shuffledPool = [...BOT_NAMES_POOL].sort(() => Math.random() - 0.5);
    for (const candidate of shuffledPool) {
      if (!existingNames.has(candidate.toLowerCase())) {
        botName = candidate;
        break;
      }
    }

    if (!botName) {
      const botCount = players.filter(p => p.is_bot).length;
      botName = `Bot ${botCount + 1}`;
    }

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
    
    // Auto-generate music for bots with specific musical tastes
    const players = await Player.findBySession(session.id);
    const bots = players.filter(p => p.is_bot);
    
    const GENRE_QUERIES = {
      metal: ['Metallica', 'Iron Maiden', 'Slipknot', 'System of a Down', 'Gojira', 'Rammstein', 'Megadeth', 'Slayer', 'Nightwish', 'Korn', 'Guns N\' Roses', 'Black Sabbath', 'Judas Priest', 'Motorhead', 'Tool', 'Deftones', 'Avenged Sevenfold'],
      electro: ['Daft Punk', 'David Guetta', 'Avicii', 'Calvin Harris', 'Kygo', 'Martin Garrix', 'Justice', 'Fred again..', 'Peggy Gou', 'Disclosure', 'Deadmau5', 'Skrillex', 'Swedish House Mafia', 'Fatboy Slim', 'Flume', 'Paul Kalkbrenner', 'Petit Biscuit'],
      reggae: ['Bob Marley', 'Dub Inc', 'Naâman', 'Tiken Jah Fakoly', 'Damian Marley', 'Alpha Blondy', 'Alborosie', 'Protoje', 'Chronixx', 'Buju Banton', 'Shaggy', 'Sean Paul', 'Jimmy Cliff', 'Peter Tosh', 'Steel Pulse', 'Groundation', 'Danakil', 'Tryo'],
      variete: ['Celine Dion', 'Jean-Jacques Goldman', 'Francis Cabrel', 'Michel Sardou', 'Johnny Hallyday', 'Mylene Farmer', 'Stromae', 'Clara Luciani', 'Vianney', 'Angèle', 'Edith Piaf', 'Charles Aznavour', 'Serge Gainsbourg', 'Jacques Brel', 'Georges Brassens', 'Renaud', 'Daniel Balavoine', 'Indochine'],
      pop: ['The Weeknd', 'Ed Sheeran', 'Billie Eilish', 'Harry Styles', 'Taylor Swift', 'Dua Lipa', 'Bruno Mars', 'Ariana Grande', 'Justin Bieber', 'Miley Cyrus', 'Lady Gaga', 'Rihanna', 'Beyoncé', 'Katy Perry', 'Shakira', 'Michael Jackson', 'Madonna', 'Britney Spears', 'Coldplay'],
      rap: ['Eminem', 'Dr. Dre', 'Snoop Dogg', 'Tupac', 'Jay-Z', 'Kendrick Lamar', 'Drake', 'Kanye West', 'Travis Scott', '50 Cent', 'Lil Wayne', 'Post Malone', 'Mac Miller'],
      disco: ['ABBA', 'Bee Gees', 'Boney M', 'Chic', 'Earth, Wind & Fire', 'Donna Summer', 'Gloria Gaynor', 'Kool & The Gang', 'Diana Ross', 'Sister Sledge', 'Jamiroquai', 'Prince', 'Stevie Wonder', 'Rick James'],
      rock: ['Queen', 'Pink Floyd', 'Led Zeppelin', 'AC/DC', 'The Rolling Stones', 'Nirvana', 'Radiohead', 'U2', 'Coldplay', 'Muse', 'The Beatles', 'Oasis', 'Blur', 'Arctic Monkeys', 'The Strokes', 'Red Hot Chili Peppers', 'Green Day', 'Foo Fighters', 'Linkin Park', 'Gorillaz'],
      jazz: ['Miles Davis', 'John Coltrane', 'Ella Fitzgerald', 'Louis Armstrong', 'Billie Holiday', 'Nina Simone', 'Ray Charles', 'B.B. King', 'Etta James', 'Frank Sinatra', 'Norah Jones', 'Gregory Porter', 'Chet Baker', 'Aretha Franklin', 'Otis Redding', 'Al Green'],
      soundtrack: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Ludovico Einaudi', 'Joe Hisaishi', 'Yann Tiersen', 'Ramin Djawadi', 'Danny Elfman', 'Howard Shore', 'Alan Silvestri'],
      classical: ['Mozart', 'Beethoven', 'Bach', 'Chopin', 'Vivaldi', 'Debussy', 'Tchaikovsky'],
      rnb: ['Marvin Gaye', 'Amy Winehouse', 'Alicia Keys', 'John Legend', 'Usher', 'Ne-Yo', 'Destiny\'s Child', 'TLC', 'SZA', 'Frank Ocean', 'Erykah Badu', 'Lauryn Hill', 'Leon Bridges', 'Silk Sonic'],
      synthwave: ['Depeche Mode', 'New Order', 'The Cure', 'Tears for Fears', 'Eurythmics', 'Pet Shop Boys', 'A-ha', 'Duran Duran', 'Kavinsky', 'The Midnight', 'Carpenter Brut', 'Gunship', 'FM-84', 'Perturbator'],
      latin: ['Daddy Yankee', 'Bad Bunny', 'J Balvin', 'Maluma', 'Karol G', 'Rosalia', 'Enrique Iglesias', 'Ricky Martin', 'Luis Fonsi', 'Pitbull', 'Don Omar', 'Marc Anthony', 'Celia Cruz', 'Santana', 'Buena Vista Social Club', 'Manu Chao', 'Juanes'],
      lofi: ['Nujabes', 'J Dilla', 'Lofi Girl', 'Idealism', 'Jinsang', 'Kudasai', 'Saib', 'Elijah Who', 'SwuM', 'Wun Two', 'Tomppabeats'],
      grunge: ['Pearl Jam', 'Soundgarden', 'Alice in Chains', 'Stone Temple Pilots', 'Smashing Pumpkins', 'Sonic Youth', 'PJ Harvey', 'Garbage', 'Weezer', 'Beck', 'Incubus', 'Audioslave', 'Rage Against the Machine'],
      afrobeats: ['Burna Boy', 'Wizkid', 'Davido', 'Rema', 'Asake', 'Fireboy DML', 'Tems', 'Tiwa Savage', 'CKay', 'Omah Lay', 'Fela Kuti', 'Magic System', 'Fally Ipupa', 'Salif Keita', 'Youssou N\'Dour'],
      kpop: ['BTS', 'BLACKPINK', 'Twice', 'NewJeans', 'Stray Kids', 'IU', 'Utada Hikaru', 'Kenshi Yonezu', 'Yoasobi', 'Babymetal', 'Perfume', 'One Ok Rock', 'Radwimps', 'LiSA', 'Aimer'],
      country: ['Johnny Cash', 'Dolly Parton', 'Willie Nelson', 'Shania Twain', 'Luke Combs', 'Morgan Wallen', 'Zach Bryan', 'Chris Stapleton', 'Bob Dylan', 'Neil Young', 'Joni Mitchell', 'Simon & Garfunkel', 'Mumford & Sons', 'The Lumineers', 'Fleet Foxes', 'Bon Iver', 'Vance Joy'],
      punk: ['The Clash', 'Ramones', 'Sex Pistols', 'Blink-182', 'Sum 41', 'The Offspring', 'Rancid', 'NOFX', 'Bad Religion', 'Rise Against', 'Sublime', 'Madness', 'The Specials', 'Reel Big Fish'],
      french_rap: ['IAM', 'Supreme NTM', 'Booba', 'Kaaris', 'PNL', 'Nekfeu', 'Lomepal', 'Vald', 'Niska', 'SCH', 'Gims', 'PLK', 'Hamza', 'Freeze Corleone', 'Laylow', 'Josman', 'Dinos', 'Kery James'],
      math_rock: ['Tricot', 'Covet', 'Chon', 'Elephant Gym', 'TTNG', 'Delta Sleep', 'American Football'],
      shoegaze: ['Slowdive', 'My Bloody Valentine', 'Cocteau Twins', 'Alcest', 'DIIV', 'Ride', 'Lush'],
      idm_glitch: ['Boards of Canada', 'Autechre', 'Venetian Snares', 'Squarepusher', 'Jon Hopkins', 'Lorn'],
      vaporwave: ['Saint Pepsi', 'Macross 82-99', 'Yung Bae', 'Luxury Elite', 'Blank Banshee', 'Vektroid'],
      post_rock: ['Godspeed You! Black Emperor', 'Mono', 'Explosions in the Sky', 'Mogwai', 'Caspian', 'Russian Circles'],
      dark_folk: ['Colter Wall', 'Tyler Childers', 'Orville Peck', 'Amigo the Devil', 'Chelsea Wolfe', 'Emma Ruth Rundle'],
      chiptune: ['Anamanaguchi', 'Sabrepulse', 'Chipzel', 'Disasterpeace', 'Dubmood', 'Slagsmålsklubben'],
      krautrock: ['Can', 'Neu!', 'Faust', 'Amon Düül II', 'Tangerine Dream'],
      dungeon_synth: ['Mortiis', 'Depressive Silence', 'Fief', 'Lustmord', 'Atrium Carceri']
    };
    
    const genres = Object.keys(GENRE_QUERIES);

    for (const bot of bots) {
      const favoriteGenre = genres[bot.id % genres.length];
      const artistPool = [...GENRE_QUERIES[favoriteGenre]].sort(() => Math.random() - 0.5);
      
      const limit = session.max_musics_per_player;
      let submittedCount = 0;
      
      for (let i = 0; i < artistPool.length && submittedCount < limit; i++) {
        const artist = artistPool[i];
        try {
          const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(artist)}&limit=25`;
          const response = await fetch(searchUrl);
          if (response.ok) {
            const payload = await response.json();
            const results = (payload?.data || []).filter(r => r.preview);
            
            if (results.length > 0) {
              const randomTrack = results[Math.floor(Math.random() * results.length)];
              
              await Music.create({
                sessionId: session.id,
                playerId: bot.id,
                title: randomTrack.title,
                artist: randomTrack.artist.name,
                filePath: randomTrack.preview ? randomTrack.preview.replace('http://', 'https://') : '',
                coverUrl: randomTrack.album?.cover_medium ? randomTrack.album.cover_medium.replace('http://', 'https://') : null
              });
              
              submittedCount++;
              this.log(session.code, `Bot ${bot.name} (${favoriteGenre}) submitted: ${randomTrack.title} by ${randomTrack.artist.name}`);
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch custom genre track for bot: ${bot.name}`, err);
        }
      }
      
      // Fallback in case we couldn't get enough tracks for the bot
      if (submittedCount < limit) {
        const shuffledTracks = [...BOT_TRACKS].sort(() => Math.random() - 0.5);
        for (let i = submittedCount; i < limit; i++) {
          const track = shuffledTracks[i % shuffledTracks.length];
          
          let freshFilePath = null;
          let coverUrl = null;
          try {
            const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(`${track.title} ${track.artist}`)}&limit=1`;
            const response = await fetch(searchUrl);
            if (response.ok) {
              const payload = await response.json();
              if (payload?.data?.[0]?.preview) {
                freshFilePath = payload.data[0].preview.replace('http://', 'https://');
                coverUrl = payload.data[0].album?.cover_medium ? payload.data[0].album.cover_medium.replace('http://', 'https://') : null;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch fresh preview for bot fallback track: ${track.title}`, err);
          }

          // If the primary search failed, try to query for a known popular track to get a fresh working preview URL
          if (!freshFilePath) {
            try {
              const fallbackSearchUrl = `https://api.deezer.com/search?q=artist:"The Weeknd" track:"Blinding Lights"&limit=1`;
              const response = await fetch(fallbackSearchUrl);
              if (response.ok) {
                const payload = await response.json();
                if (payload?.data?.[0]?.preview) {
                  freshFilePath = payload.data[0].preview.replace('http://', 'https://');
                  coverUrl = payload.data[0].album?.cover_medium ? payload.data[0].album.cover_medium.replace('http://', 'https://') : null;
                }
              }
            } catch (err) {
              console.warn("Failed to fetch absolute fallback track:", err);
            }
          }

          // Absolute last resort (using the hardcoded file_path)
          if (!freshFilePath) {
            freshFilePath = track.file_path.replace('http://', 'https://');
          }

          await Music.create({
            sessionId: session.id,
            playerId: bot.id,
            title: track.title,
            artist: track.artist,
            filePath: freshFilePath,
            coverUrl
          });
          this.log(session.code, `Bot ${bot.name} (fallback) submitted: ${track.title}`);
        }
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
      
      // If blind test is enabled, generate options
      if (session.enable_blind_test) {
        try {
          const track = shuffledMusics[i];
          const searchUrl = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(track.artist)}"&limit=15`;
          const response = await fetch(searchUrl);
          let options = [];
          
          const normCorrectTitle = normalizeTitle(track.title);

          if (response.ok) {
            const payload = await response.json();
            const results = payload?.data || [];
            
            // Filter out tracks that have the same normalized title as the correct one
            const filtered = results.filter(r => {
              const normOptionTitle = normalizeTitle(r.title);
              return normOptionTitle !== normCorrectTitle;
            });

            // Shuffle filtered tracks
            const shuffledFiltered = filtered.sort(() => Math.random() - 0.5);

            // Add unique normalized titles to options
            for (const r of shuffledFiltered) {
              if (options.length >= 3) break;
              const normOptionTitle = normalizeTitle(r.title);
              const isDuplicate = options.some(o => normalizeTitle(o.title) === normOptionTitle);
              if (!isDuplicate) {
                options.push({ title: r.title, artist: r.artist.name });
              }
            }
          }

          // Fallbacks if we don't have 3 unique options
          while (options.length < 3) {
             const fallback = BOT_TRACKS[Math.floor(Math.random() * BOT_TRACKS.length)];
             const normFallbackTitle = normalizeTitle(fallback.title);
             
             if (normFallbackTitle !== normCorrectTitle) {
               const isDuplicate = options.some(o => normalizeTitle(o.title) === normFallbackTitle);
               if (!isDuplicate) {
                 options.push({ title: fallback.title, artist: fallback.artist });
               }
             }
          }

          // Add the correct track
          options.push({ title: track.title, artist: track.artist });
          // Shuffle
          options.sort(() => Math.random() - 0.5);
          
          await query('UPDATE musics SET blind_test_options = $1 WHERE id = $2', [JSON.stringify(options), track.id]);
        } catch (err) {
          this.log(code, `Failed to generate blind test options for music ${shuffledMusics[i].id}: ${err.message}`);
        }
      }
    }

    // Clear previous votes
    await query('DELETE FROM votes WHERE session_id = $1', [session.id]);
    await query('DELETE FROM blind_test_answers WHERE session_id = $1', [session.id]);

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
      duration = session.auto_advance ? 10 : 0;
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

  async advanceRound(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }
    if (session.phase !== 'voting') {
      throw new Error('La phase de vote n\'est pas active');
    }

    const status = session.voting_status;
    const musicIndex = session.current_music_index;

    this.clearTimer(code);

    if (status === 'listening') {
      await this.enterVotingSubphase(code, musicIndex, 'voting');
    } else if (status === 'voting') {
      if (session.show_answers) {
        await this.enterVotingSubphase(code, musicIndex, 'revelation');
      } else {
        await this.nextRound(code, musicIndex);
      }
    } else if (status === 'revelation') {
      const musics = await Music.findBySession(session.id);
      const activeMusics = musics.filter(m => m.play_order >= 0);
      const nextIndex = musicIndex + 1;

      if (nextIndex < activeMusics.length) {
        await this.enterVotingSubphase(code, nextIndex, 'listening');
      } else {
        await this.finishSession(code);
      }
    }
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

  async submitBlindTestAnswer(code, playerId, musicId, answerTitle, answerArtist) {
    const session = await Session.findByCode(code);
    if (!session || session.phase !== 'voting' || session.voting_status !== 'listening' || !session.enable_blind_test) {
      throw new Error('Action non autorisée');
    }
    
    // Check if player is an observer
    const players = await Player.findBySession(session.id);
    const player = players.find(p => p.id === playerId);
    if (!player || player.is_observer) throw new Error('Action non autorisée');
    
    const music = await Music.findById(musicId);
    if (!music || music.session_id !== session.id) throw new Error('Musique introuvable');
    if (music.player_id === playerId) {
      throw new Error('Vous ne pouvez pas participer au blind test pour votre propre musique');
    }
    
    const isCorrect = music.title === answerTitle && music.artist === answerArtist;
    
    await query(
      `INSERT INTO blind_test_answers (session_id, player_id, music_id, answer_title, answer_artist, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id, player_id, music_id) DO UPDATE SET answer_title = EXCLUDED.answer_title, answer_artist = EXCLUDED.answer_artist, is_correct = EXCLUDED.is_correct`,
      [session.id, playerId, musicId, answerTitle, answerArtist, isCorrect]
    );
    
    this.log(code, `Blind test answer submitted: player ${playerId} answered ${answerTitle} for music ${musicId}`);

    await this.broadcastState(code);
    return this.getState(code, playerId);
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
    const blindTestAnswers = await query('SELECT * FROM blind_test_answers WHERE session_id = $1', [session.id]).then(res => res.rows);

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

    // Add blind test scores
    if (session.enable_blind_test) {
      for (const answer of blindTestAnswers) {
        if (answer.is_correct) {
          const player = playerMap.get(answer.player_id);
          if (player) {
            player.correctGuesses += 1;
          }
        }
      }
    }

    for (const p of playerMap.values()) {
      p.score = p.correctGuesses;
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
    let statePayload = {};

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

      statePayload = {
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
        
        const parsedPlayerId = playerId ? Number.parseInt(playerId, 10) : null;
        currentMusic.is_proposer = parsedPlayerId === currentTrack.player_id;
        
        // Hide proposer (player_id) unless we are in the revelation subphase AND show_answers is true
        const isReveal = session.voting_status === 'revelation' && session.show_answers;
        if (!isReveal) {
          delete currentMusic.player_id;
        }

        // Return votes for the current track
        const currentVotes = votes.filter(v => v.music_id === currentMusic.id);
        const currentBlindTestAnswers = blindTestAnswers.filter(b => b.music_id === currentMusic.id);
        
        if (session.enable_blind_test) {
          currentMusic.blind_test_answers = currentBlindTestAnswers;
          // Hide other players' answers unless revelation
          if (session.voting_status === 'listening' || session.voting_status === 'voting') {
             const parsedPlayerId = playerId ? Number.parseInt(playerId, 10) : null;
             if (parsedPlayerId) {
                currentMusic.blind_test_answers = currentBlindTestAnswers.filter(b => b.player_id === parsedPlayerId);
             } else {
                currentMusic.blind_test_answers = [];
             }
          }
        }
        
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
      statePayload = {
        session,
        players: computedPlayers,
        currentMusic,
        votes: votesForCurrentMusic
      };
    } else if (session.phase === 'results') {
      // Reveal everything
      statePayload = {
        session,
        players: computedPlayers,
        musics: rawMusics,
        votes
      };
    } else {
      // waiting phase
      const parsedPlayerIdWaiting = playerId ? Number.parseInt(playerId, 10) : null;
      const playerSelfWaiting = parsedPlayerIdWaiting ? computedPlayers.find(p => p.id === parsedPlayerIdWaiting) || null : null;
      statePayload = {
        session,
        players: computedPlayers,
        musics: rawMusics,
        player: playerSelfWaiting
      };
    }

    return {
      ...statePayload,
      serverTime: new Date().toISOString()
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
      const activeRemaining = remainingMusics.filter(m => m.play_order >= 0);
      activeRemaining.sort((a, b) => a.play_order - b.play_order);
      for (let index = 0; index < activeRemaining.length; index++) {
        await query('UPDATE musics SET play_order = $1 WHERE id = $2', [index, activeRemaining[index].id]);
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
  async regenerateAvatar(code, playerId) {
    const session = await Session.findByCode(code);
    if (!session) throw new Error('Session introuvable');

    const newSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const updatedPlayer = await Player.updateAvatarSeed(playerId, newSeed);
    
    if (!updatedPlayer) {
      throw new Error('Joueur introuvable');
    }

    this.log(code, `Player ${updatedPlayer.name} regenerated avatar`);
    await this.broadcastState(code);
    return this.getState(code, playerId);
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
