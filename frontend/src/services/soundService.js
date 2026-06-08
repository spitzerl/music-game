let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export default {
  play(type) {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === 'join') {
        // High pitched ascending chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          
          gain.gain.setValueAtTime(0, now + index * 0.08);
          gain.gain.linearRampToValueAtTime(0.1, now + index * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.25);
        });
      } else if (type === 'phase_change') {
        // Pleasant ascending chord sweep
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        freqs.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + index * 0.1);
          
          gain.gain.setValueAtTime(0, now + index * 0.1);
          gain.gain.linearRampToValueAtTime(0.12, now + index * 0.1 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + index * 0.1);
          osc.stop(now + index * 0.1 + 0.4);
        });
      } else if (type === 'vote_closed') {
        // A short warning alert or ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.15);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'game_ended') {
        // Celebratory fanfare (C4 -> G4 -> C5 -> E5 -> G5)
        const notes = [261.63, 392.00, 523.25, 659.25, 783.99];
        const durations = [0.15, 0.15, 0.15, 0.15, 0.5];
        let timeOffset = 0;
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          const dur = durations[index];
          gain.gain.setValueAtTime(0, now + timeOffset);
          gain.gain.linearRampToValueAtTime(0.12, now + timeOffset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + dur);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + dur);
          timeOffset += dur * 0.7;
        });
      }
    } catch (err) {
      console.warn('AudioContext warning:', err.message);
    }
  }
};
