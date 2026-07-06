/**
 * Tiny synthesized sound engine for the arena. No audio files: every effect is
 * generated with the Web Audio API, so there is nothing to load and nothing to
 * ship. The AudioContext is created lazily on the first user gesture (browsers
 * require that), and everything can be muted.
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Call from a user gesture (keydown / pointerdown) to unlock audio. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    } catch {
      // audio unavailable; stay silent
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + dur);
  }

  private noise(dur: number, vol: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.master);
    src.start();
  }

  chomp() {
    this.noise(0.07, 0.28);
    this.tone(190, 0.09, "square", 0.22, 90);
  }

  win() {
    this.tone(460, 0.11, "triangle", 0.28, 900);
  }

  bigWin() {
    this.tone(330, 0.14, "triangle", 0.32, 660);
    this.tone(494, 0.18, "triangle", 0.22, 988);
  }

  hurt() {
    this.tone(130, 0.16, "sawtooth", 0.26, 60);
  }

  dash() {
    this.noise(0.12, 0.22);
    this.tone(220, 0.12, "sine", 0.18, 620);
  }

  frenzy() {
    this.tone(523, 0.09, "square", 0.28);
    this.tone(784, 0.12, "square", 0.24);
  }

  secure() {
    this.tone(392, 0.1, "triangle", 0.26, 587);
  }
}
