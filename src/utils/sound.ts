// Realistic Synthesized Foley & Acoustic Sound Engine (Web Audio API)

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playSlash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Air whoosh (bandpass filtered noise)
    const noiseBuffer = this.createNoiseBuffer(0.16);
    if (noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 0.15);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.15);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(now);
    }

    // Subtle steel ring overtone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.11);
    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Heavy armor impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Metallic clank harmonic
    const clang = this.ctx.createOscillator();
    const clangGain = this.ctx.createGain();
    clang.type = 'square';
    clang.frequency.setValueAtTime(920, now);
    clang.frequency.exponentialRampToValueAtTime(410, now + 0.08);
    clangGain.gain.setValueAtTime(0.08, now);
    clangGain.gain.exponentialRampToValueAtTime(0.002, now + 0.08);
    clang.connect(clangGain);
    clangGain.connect(this.ctx.destination);
    clang.start(now);
    clang.stop(now + 0.09);
  }

  playParry() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [1320, 1980, 2640].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.28);
      gain.gain.setValueAtTime(0.12 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.29);
    });
  }

  playGather() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Crisp earthy/timber acoustic thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playHeal() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.09, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.004, now + idx * 0.055 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.26);
    });
  }

  playBossLaserBlast() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep seismic sub-bass impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.55);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.55);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.56);

    // Shockwave crackle
    const noise = this.createNoiseBuffer(0.45);
    if (noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = noise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.22, now);
      nGain.gain.exponentialRampToValueAtTime(0.005, now + 0.44);
      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      src.start(now);
    }
  }

  playTeleport() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Resonant bronze temple bell + quantum shimmer
    [528, 792, 1056].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.65);
      gain.gain.setValueAtTime(0.14 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.66);
    });
  }
}

export const sound = new SoundManager();
