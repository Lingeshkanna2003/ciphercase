export type SoundCue = 'open' | 'discover' | 'compare' | 'error' | 'solve';

let audioContext: AudioContext | null = null;

const cueNotes: Record<SoundCue, number[]> = {
  open: [392, 523],
  discover: [523, 659, 784],
  compare: [440, 587],
  error: [196, 174],
  solve: [392, 523, 659, 784],
};

export function playSound(enabled: boolean, cue: SoundCue): void {
  if (!enabled || typeof window === 'undefined') return;
  const Context = window.AudioContext;
  if (!Context) return;
  try {
    audioContext ??= new Context();
    if (audioContext.state === 'suspended') void audioContext.resume();
    const now = audioContext.currentTime;
    const notes = cueNotes[cue];
    const total = cue === 'error' ? .24 : cue === 'solve' ? .62 : .34;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue === 'error' ? .022 : .032, now + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, now + total);
    gain.connect(audioContext.destination);
    notes.forEach((frequency, index) => {
      const oscillator = audioContext!.createOscillator();
      const noteStart = now + index * (cue === 'solve' ? .105 : .065);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.connect(gain);
      oscillator.start(noteStart);
      oscillator.stop(now + total);
    });
    window.setTimeout(() => gain.disconnect(), total * 1000 + 50);
  } catch {
    // Audio is an optional enhancement; unsupported or blocked audio stays silent.
  }
}
