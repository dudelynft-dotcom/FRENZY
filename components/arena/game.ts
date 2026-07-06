/**
 * Feeding Frenzy - real-time swimming arena (single-player vs computer-controlled fish).
 *
 * This is the playable prototype of the live-combat direction: you steer a fish
 * through a depth-graded ocean, eat smaller fish (aim your MOUTH at them), nibble
 * bigger fish from BEHIND for small winnings (drift into their mouth and you're
 * eaten), swell as you carry winnings, and swim to the SURFACE to bank them.
 *
 * Framework-agnostic on purpose: no React, no DOM beyond the passed canvas. The
 * React wrapper mounts it, feeds input, and reads getHud() for the overlay.
 *
 * Money model mirrors the vault design: your base size is your safe "deposit"
 * (principal) - never lost. Winnings you eat are "carried" (at risk) until you
 * surface and bank them. Get eaten and you drop only the carried winnings.
 */

import { Sound } from "./sound";

export type ThreatZone = "danger" | "payday" | "clear" | "none";

export type Hud = {
  tier: number;
  tierName: string;
  deposit: number; // protected stake - always safe
  carried: number; // winnings this dive - at risk below the surface
  wallet: number; // safe CHUM in your wallet (upgrades + withdrawals)
  canSecure: boolean; // true when at the surface with winnings to secure
  safeZone: boolean; // true when in the surface band (no combat)
  size: number; // deposit + carried
  hp: number; // 0..1 health
  chum: number; // alias of wallet (kept for the balance chip)
  attackLvl: number;
  defenseLvl: number;
  attackCost: number; // $CHUM for the next attack upgrade
  defenseCost: number;
  chumBurned: number; // total $CHUM burned (90% of upgrades)
  leaderboardPool: number; // total to the weekly leaderboard (10% of upgrades)
  depthLabel: string;
  guard: number; // spawn-immunity seconds remaining
  alive: boolean;
  message: string;
  fishAlive: number;
  threat: { zone: ThreatZone; label: string; targetTier: string };
  combo: number; // current eat chain (0 when not active)
  dashReady: number; // 0..1, dash cooldown progress (1 = ready)
  frenzy: boolean; // a feeding frenzy is active
  frenzyBanner: boolean; // show the frenzy banner
  muted: boolean;
};

type Fish = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // facing, radians
  radius: number;
  value: number; // total size (deposit + winnings) - drives who eats whom
  winnings: number; // the eatable portion; deposit (value - winnings) is always safe
  hp: number; // 0..MAX_HP - combat is HP attrition, not instant
  attack: number; // attack multiplier (players upgrade this with $CHUM)
  defense: number; // defense multiplier (slows incoming damage)
  isPlayer: boolean;
  hue: number; // trait seed 0..1
  tailPhase: number;
  wanderAngle: number;
  homeY: number; // preferred depth - big fish sink, small fish rise
  biteFlash: number; // >0 briefly after landing a bite
  hurtFlash: number;
  nibbleCd: number; // cooldown so a single contact doesn't drain per-frame
  dead: boolean;
};

export const TIER_MIN = [0, 50, 250, 1000, 5000, 25000]; // CHUM tier lower bounds
export const TIER_NAMES = ["Spawn", "Snapper", "Barracuda", "Shark", "Orca", "Leviathan"];

// Pixel-art silhouettes per tier (same language as the site's PixelFish). Fish
// face LEFT; the renderer mirrors them to face travel direction. Legend:
//   b body · s belly · d dark marking · f fin/tail · e eye · p pupil · j teeth · g gold spine
export const SILHOUETTES: Record<number, string[]> = {
  1: ["..bbb...", ".bbbbbf.", "bpbbbbff", ".bsssbf.", "..sss..."],
  2: [
    "....ff.......",
    "...bbf.......",
    "..bbbbbb.....",
    ".beebbbbb..f.",
    "bbpebbbbbbff.",
    ".bsbbbbbb..f.",
    "..sssssb.....",
    "....ff.......",
  ],
  3: [
    "......ddddddd......",
    "..bbbbbbbbbbbbbb.f.",
    "bpebbbbbbbbbbbbbbff",
    ".jbssssssssbbbbb.f.",
    "....ff....ff.......",
  ],
  4: [
    ".........ff.........",
    "........fff.........",
    ".......bfff.........",
    "...bbbbbbbbbbbb..f..",
    "..beebbbbdbbbbbb.ff.",
    "bbpebbbbbdbbbbbbbfff",
    ".jbbssssdssbbbbb.ff.",
    "..jjsssssssbbb...f..",
    ".....ff...ff........",
    "......f....f........",
  ],
  5: [
    ".........gg...........",
    "........bbg...........",
    ".......bbbb...........",
    "....bbbbbbbbbbbbb.....",
    "..bbbbbbbbbbbbbbbbb.f.",
    ".beebbbbbbbbbbbbbbbbff",
    "bpeebbbbbbbbbbbbbbbfff",
    "bssssbbbbbbbbbbbbbb.ff",
    ".sssssssbbbbbbbbbb...f",
    "...ffff.....fff.......",
    "....ff.......f........",
  ],
  6: [
    "....g....g....g.........",
    "...ggg..ggg..ggg........",
    "..bbbbbbbbbbbbbbbbb.....",
    ".bbbbbbbbbbbbbbbbbbbb...",
    "beebbbbbbbdbbbbbbbbbbb.f",
    "bpebbbbbbbdbbbbbbbbbbbff",
    "bbbbbbbbbbdbbbbbbbbbbfff",
    "jbbbbbbbbbdbbbbbbbbbbbff",
    ".j.bssssssssssbbbbbbb.f.",
    "..jssssssssssssbbbbb....",
    "....ffff......ffff......",
    ".....ff........fff......",
    "......f.........ff......",
  ],
};

const tierNameOf = (value: number) => TIER_NAMES[tierFor(value) - 1];

export function tierFor(v: number): number {
  let t = 1;
  for (let i = TIER_MIN.length - 1; i >= 0; i--) {
    if (v >= TIER_MIN[i]) {
      t = i + 1;
      break;
    }
  }
  return t;
}

// radius (px) from vault size (USD) - small, clean marks like the depth chart.
// Player ~12px, Leviathan ~52px: readable, nimble, never a screen-filling wall.
function radiusFor(value: number): number {
  return Math.min(52, 5 + Math.pow(Math.max(0, value), 0.3) * 2.2);
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);

// Combat tuning - "slow bleed" skill window (spec: ~10s takedown, ~10% loss).
const MAX_HP = 100;
const BLEED_DPS = 11; // base damage/sec at even power → ~9s to drain
const HP_REGEN = 12; // HP/sec recovered when not losing a duel
const TAKEDOWN_IMMUNITY = 2.5; // seconds of safety after being taken down
const WITHDRAW_RESET = 20; // CHUM the fish keeps after you cash out (a Spawn seed)
const SAFE_BAND = 50; // world px below the surface line that counts as the safe zone
const BITE_RATE = 0.05; // base fraction of the victim's stake bitten per second (even power)

// Feel / skill tuning.
const DASH_COOLDOWN = 3.2; // seconds between dashes
const DASH_TIME = 0.18; // dash duration
const DASH_SPEED = 2.6; // speed multiplier while dashing
const COMBO_WINDOW = 3; // seconds to chain the next eat
const BOUNTY_BONUS = 2.5; // a bounty fish pays this multiple of its winnings

// $CHUM upgrade economy (mock). Each level costs more; 90% burned, 10% to the weekly pool.
const UPGRADE_BASE_COST = 100;
const ATTACK_PER_LVL = 0.15; // +15% attack per level
const DEFENSE_PER_LVL = 0.18; // +18% effective defense per level
const upgradeCost = (level: number) => UPGRADE_BASE_COST * (level + 1);

export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pointerActive: boolean;
  pointerX: number; // world coords
  pointerY: number;
};

export class ArenaGame {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private running = false;

  private W = 0; // css pixels (viewport)
  private H = 0;
  private worldH = 2600; // ocean depth in world px (camera follows vertically)
  private surfaceY = 210; // world y of the safe surface band bottom

  private cameraY = 0;
  private rngState = 0x1a2b3c4d;
  private t = 0; // global time (s) for ambient water motion
  private bubbles: { x: number; y: number; r: number; sp: number; phase: number }[] = [];
  // Ambient life and scenery (decor only, no combat).
  private seabedY = 0;
  private seaweed: { x: number; h: number; phase: number; blades: number; hue: number }[] = [];
  private snails: { x: number; dir: number }[] = [];
  private critters: { kind: "turtle" | "octopus"; x: number; y: number; vx: number; phase: number }[] = [];

  // Juice, skill, and events.
  private sound = new Sound();
  private particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }[] = [];
  private floaters: { x: number; y: number; life: number; text: string; color: string; big: boolean }[] = [];
  private shake = 0;
  private combo = 0;
  private comboTimer = 0;
  private dashCd = 0;
  private dashTime = 0;
  private frenzyTimer = 35; // seconds to the next feeding frenzy
  private frenzyActive = 0; // remaining frenzy time
  private frenzyBannerT = 0; // banner flash
  private bountyFish: Fish | null = null;
  private bountyTimer = 9;
  private biteFxCd = 0;

  private fish: Fish[] = [];
  private player!: Fish;
  // All money is $CHUM. Pools:
  //  - deposit: your protected stake. ALWAYS SAFE - never lost, even in the sea. Sets size/tier/power.
  //  - carried: winnings grabbed THIS dive. AT RISK below the surface; safe once you surface. Secure -> deposit.
  //  - chum: your wallet. SAFE. Upgrades spend from here; the dashboard withdraws deposit -> wallet.
  private deposit = 50;
  private carried = 0;
  private playerGuard = 0; // spawn immunity (seconds)
  private inSafeZone = false; // true while in the surface band - no combat there
  private tookDamage = false; // set each tick the player is losing a duel (blocks HP regen)
  private takedownFlash = 0; // brief red flash after a takedown
  // $CHUM wallet (mock) - safe balance for upgrades + withdrawals
  private chum = 500;
  private attackLvl = 0;
  private defenseLvl = 0;
  private chumBurned = 0;
  private leaderboardPool = 0;
  private message = "You're safe at the surface. Watch the water, then dive when you're ready.";
  private msgTimer = 4;
  private spawnTimer = 0;

  input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas not supported");
    this.ctx = ctx;
    this.resize();
    this.spawnPlayer();
    for (let i = 0; i < 34; i++) this.spawnFish();
    for (let i = 0; i < 46; i++) {
      this.bubbles.push({
        x: this.rnd() * this.W,
        y: this.surfaceY + this.rnd() * (this.worldH - this.surfaceY),
        r: 0.8 + this.rnd() * 2.4,
        sp: 12 + this.rnd() * 26,
        phase: this.rnd() * 6.28,
      });
    }
    // Scenery on and near the seabed.
    this.seabedY = this.worldH - 24;
    for (let i = 0; i < 16; i++) {
      this.seaweed.push({
        x: this.rnd() * this.W,
        h: 44 + this.rnd() * 96,
        phase: this.rnd() * 6.28,
        blades: 2 + Math.floor(this.rnd() * 3),
        hue: this.rnd(),
      });
    }
    for (let i = 0; i < 7; i++) this.snails.push({ x: this.rnd() * this.W, dir: this.rnd() < 0.5 ? -1 : 1 });
    this.critters.push({ kind: "turtle", x: this.rnd() * this.W, y: this.worldH * 0.56, vx: 20, phase: 0 });
    this.critters.push({ kind: "octopus", x: this.W * 0.72, y: this.seabedY - 12, vx: 0, phase: 0 });
    this.critters.push({ kind: "octopus", x: this.W * 0.2, y: this.seabedY - 12, vx: 0, phase: 3 });
  }

  // Deterministic-ish RNG (varies by call; fine for a client game).
  private rnd(): number {
    this.rngState ^= this.rngState << 13;
    this.rngState ^= this.rngState >>> 17;
    this.rngState ^= this.rngState << 5;
    return ((this.rngState >>> 0) % 100000) / 100000;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private spawnPlayer() {
    const y = this.surfaceY + 20; // start in the surface safe zone; survey, then dive
    const size = this.deposit + this.carried; // fish size = deposit + carried winnings
    this.player = {
      // The surface is wide: spawn at a varied spot along it, not always the middle.
      x: this.W * (0.12 + this.rnd() * 0.76),
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: radiusFor(size),
      value: size,
      winnings: 0,
      hp: MAX_HP,
      attack: 1 + ATTACK_PER_LVL * this.attackLvl,
      defense: 1 + DEFENSE_PER_LVL * this.defenseLvl,
      isPlayer: true,
      hue: 0.55,
      tailPhase: 0,
      wanderAngle: 0,
      homeY: y,
      biteFlash: 0,
      hurtFlash: 0,
      nibbleCd: 0,
      dead: false,
    };
    this.fish = this.fish.filter((f) => !f.isPlayer);
    this.fish.push(this.player);
    this.playerGuard = 3; // safe for 3s to get bearings
    // Shove any nearby big fish away so we never spawn inside a predator.
    for (const f of this.fish) {
      if (f.isPlayer) continue;
      const d = Math.hypot(f.x - this.player.x, f.y - this.player.y);
      if (f.radius > this.player.radius && d < 220) {
        f.y = clamp(f.y + 300, this.surfaceY, this.worldH - 40);
      }
    }
  }

  private spawnFish() {
    // Bias sizes: many small, few large; larger fish live deeper.
    const roll = this.rnd();
    let value: number;
    if (roll < 0.5) value = 20 + this.rnd() * 120;
    else if (roll < 0.78) value = 150 + this.rnd() * 500;
    else if (roll < 0.92) value = 700 + this.rnd() * 2200;
    else if (roll < 0.985) value = 3000 + this.rnd() * 12000;
    else value = 20000 + this.rnd() * 60000;

    // Home depth scales with size: small fish live near the surface (a safe
    // nursery), big fish live deep. Going deep = more reward, more danger.
    const depthBias = clamp(Math.pow(value / 60000, 0.4), 0.05, 0.95);
    const usable = this.worldH - this.surfaceY - 120;
    const homeY = clamp(this.surfaceY + 70 + depthBias * usable + (this.rnd() - 0.5) * 160, this.surfaceY + 40, this.worldH - 40);
    // Only ~55% of fish are carrying winnings; the rest are pure deposit (eating
    // them earns nothing). Winnings are a slice of the fish's size.
    const winnings = this.rnd() > 0.45 ? Math.round(value * (0.12 + this.rnd() * 0.55)) : 0;
    this.fish.push({
      x: this.rnd() * this.W,
      y: homeY,
      vx: (this.rnd() - 0.5) * 30,
      vy: (this.rnd() - 0.5) * 14,
      angle: this.rnd() * Math.PI * 2,
      radius: radiusFor(value),
      value,
      winnings,
      hp: MAX_HP,
      attack: 0.85 + this.rnd() * 0.5, // bots vary; a lucky small fish can punch up
      defense: 0.85 + this.rnd() * 0.4,
      isPlayer: false,
      hue: this.rnd(),
      tailPhase: this.rnd() * 6,
      wanderAngle: this.rnd() * Math.PI * 2,
      homeY,
      biteFlash: 0,
      hurtFlash: 0,
      nibbleCd: 0,
      dead: false,
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      let dt = (t - this.last) / 1000;
      this.last = t;
      dt = Math.min(dt, 0.05); // clamp big frame gaps
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  // --- called from the React wrapper on user gestures ---
  ensureAudio() {
    this.sound.ensure();
  }
  toggleMute(): boolean {
    this.sound.muted = !this.sound.muted;
    return this.sound.muted;
  }
  isMuted(): boolean {
    return this.sound.muted;
  }

  /** Short burst of speed in the current direction, on a cooldown. The skill move. */
  dash() {
    if (this.player.dead || this.dashCd > 0) return;
    this.dashCd = DASH_COOLDOWN;
    this.dashTime = DASH_TIME;
    this.sound.dash();
    const p = this.player;
    const ang = Math.atan2(p.vy, p.vx);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: -Math.cos(ang) * (40 + this.rnd() * 60) + (this.rnd() - 0.5) * 40,
        vy: -Math.sin(ang) * (40 + this.rnd() * 60) + (this.rnd() - 0.5) * 40,
        life: 0.4,
        max: 0.4,
        color: "rgba(226,244,245,0.85)",
        size: 2,
      });
    }
  }

  private spawnBurst(x: number, y: number, n: number, color: string, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2;
      const sp = (30 + this.rnd() * 90) * power;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 20,
        life: 0.5 + this.rnd() * 0.4,
        max: 0.9,
        color,
        size: 1.4 + this.rnd() * 2 * power,
      });
    }
  }

  private addFloater(x: number, y: number, text: string, color: string, big = false) {
    this.floaters.push({ x, y, life: big ? 1.4 : 1.0, text, color, big });
  }

  /** Start a feeding frenzy: a burst of winnings-rich fish and a banner. */
  private startFrenzy() {
    this.frenzyActive = 12;
    this.frenzyTimer = 55 + this.rnd() * 30;
    this.frenzyBannerT = 2.6;
    this.sound.frenzy();
    for (let i = 0; i < 10; i++) {
      this.spawnFish();
      const f = this.fish[this.fish.length - 1];
      if (f && !f.isPlayer) f.winnings = Math.round(f.value * (0.3 + this.rnd() * 0.5));
    }
  }

  /** Mark a random winnings-carrying fish as the bounty (bonus reward + glow). */
  private assignBounty() {
    this.bountyTimer = 10 + this.rnd() * 8;
    const options = this.fish.filter((f) => !f.isPlayer && !f.dead && f.winnings > 5);
    this.bountyFish = options.length ? options[Math.floor(this.rnd() * options.length)] : null;
  }

  private update(dt: number) {
    const p = this.player;
    this.t += dt;
    if (this.playerGuard > 0) this.playerGuard = Math.max(0, this.playerGuard - dt);

    // Bubbles drift up and wrap back to the seabed.
    for (const b of this.bubbles) {
      b.y -= b.sp * dt;
      b.x += Math.sin(this.t * 1.5 + b.phase) * 6 * dt;
      if (b.y < this.surfaceY - 10) {
        b.y = this.worldH - 10;
        b.x = this.rnd() * this.W;
      }
    }
    // Snails crawl the seabed; the turtle drifts across.
    for (const s of this.snails) {
      s.x += s.dir * 7 * dt;
      if (s.x < -12) s.x = this.W + 12;
      if (s.x > this.W + 12) s.x = -12;
    }
    for (const c of this.critters) {
      c.phase += dt;
      if (c.kind === "turtle") {
        c.x += c.vx * dt;
        if (c.x > this.W + 80) c.x = -80;
      }
    }

    // --- feel timers ---
    this.shake = Math.max(0, this.shake - dt * 16);
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.dashTime > 0) this.dashTime = Math.max(0, this.dashTime - dt);
    if (this.biteFxCd > 0) this.biteFxCd = Math.max(0, this.biteFxCd - dt);
    if (this.frenzyBannerT > 0) this.frenzyBannerT = Math.max(0, this.frenzyBannerT - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // particles + floating numbers
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 30 * dt;
      pt.life -= dt;
    }
    if (this.particles.length) this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const fl of this.floaters) {
      fl.y -= 26 * dt;
      fl.life -= dt;
    }
    if (this.floaters.length) this.floaters = this.floaters.filter((fl) => fl.life > 0);

    // feeding frenzy events
    if (this.frenzyActive > 0) {
      this.frenzyActive -= dt;
    } else {
      this.frenzyTimer -= dt;
      if (this.frenzyTimer <= 0) this.startFrenzy();
    }

    // keep a bounty fish assigned
    this.bountyTimer -= dt;
    if (this.bountyTimer <= 0 || !this.bountyFish || this.bountyFish.dead) this.assignBounty();

    // ---- Player steering ----
    if (!p.dead) {
      let dx = 0;
      let dy = 0;
      if (this.input.up) dy -= 1;
      if (this.input.down) dy += 1;
      if (this.input.left) dx -= 1;
      if (this.input.right) dx += 1;
      if (dx === 0 && dy === 0 && this.input.pointerActive) {
        dx = this.input.pointerX - p.x;
        dy = this.input.pointerY - p.y;
      }
      const len = Math.hypot(dx, dy);
      // Smaller fish are faster & nimbler - the skill edge for the little guy.
      // The deeper you go, the heavier the water: movement slows toward the deep,
      // so escaping a whale down there is genuinely harder.
      const depthT = clamp((p.y - this.surfaceY) / (this.worldH - this.surfaceY), 0, 1);
      const depthMult = 1 - depthT * 0.45; // full speed at surface, ~55% in the deep
      const dashMult = this.dashTime > 0 ? DASH_SPEED : 1;
      const speed = clamp(360 * Math.pow(radiusFor(50) / p.radius, 0.35), 120, 380) * depthMult * dashMult;
      if (len > 0.001) {
        const ax = (dx / len) * speed;
        const ay = (dy / len) * speed;
        p.vx += (ax - p.vx) * Math.min(1, dt * 6);
        p.vy += (ay - p.vy) * Math.min(1, dt * 6);
      } else {
        p.vx *= 1 - Math.min(1, dt * 2);
        p.vy *= 1 - Math.min(1, dt * 2);
      }
    }

    // ---- Integrate + bot steering ----
    for (const f of this.fish) {
      if (f.dead) continue;
      if (!f.isPlayer) this.stepAi(f, dt);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      // bounds: wrap horizontally, clamp vertically to the ocean column
      if (f.x < -40) f.x = this.W + 40;
      if (f.x > this.W + 40) f.x = -40;
      f.y = clamp(f.y, this.surfaceY - 30, this.worldH - 20);
      const sp = Math.hypot(f.vx, f.vy);
      if (sp > 4) f.angle = Math.atan2(f.vy, f.vx);
      f.tailPhase += dt * (4 + sp * 0.03);
      f.biteFlash = Math.max(0, f.biteFlash - dt * 3);
      f.hurtFlash = Math.max(0, f.hurtFlash - dt * 3);
      f.nibbleCd = Math.max(0, f.nibbleCd - dt);
    }

    this.tookDamage = false;
    this.resolveCombat(dt);
    this.resolveBotEatBot();
    // HP regenerates when you're not currently losing a duel.
    if (!this.tookDamage && p.hp < MAX_HP) p.hp = Math.min(MAX_HP, p.hp + HP_REGEN * dt);
    if (this.takedownFlash > 0) this.takedownFlash = Math.max(0, this.takedownFlash - dt * 2);

    // The surface band is a safe zone - no combat there. Below it, your staked
    // CHUM is at risk. This is why you rise to the surface and Withdraw to secure.
    this.inSafeZone = p.y < this.surfaceY + SAFE_BAND;

    // Camera follows the player vertically.
    const targetCam = clamp(p.y - this.H * 0.5, 0, this.worldH - this.H);
    this.cameraY += (targetCam - this.cameraY) * Math.min(1, dt * 4);

    // Keep the ocean populated.
    this.spawnTimer -= dt;
    const bots = this.fish.filter((f) => !f.isPlayer && !f.dead).length;
    if (this.spawnTimer <= 0 && bots < 38) {
      this.spawnFish();
      this.spawnTimer = 0.7;
    }
    this.fish = this.fish.filter((f) => !f.dead || f.isPlayer);

    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0 && p.dead) this.setMsg("Press Respawn to dive back in.");
    }
  }

  private syncPlayerSize() {
    this.player.value = this.deposit + this.carried; // size = deposit + carried
    this.player.radius = radiusFor(this.player.value);
  }

  private stepAi(f: Fish, dt: number) {
    const p = this.player;
    let steerX = Math.cos(f.wanderAngle);
    let steerY = Math.sin(f.wanderAngle);
    f.wanderAngle += (this.rnd() - 0.5) * dt * 2.5;

    const d = Math.hypot(p.x - f.x, p.y - f.y);
    const canSeePlayer = !p.dead && this.playerGuard <= 0;
    if (canSeePlayer && d < 240) {
      if (f.radius > p.radius * 1.15) {
        // Bigger than the player: hunt it.
        steerX = (p.x - f.x) / d;
        steerY = (p.y - f.y) / d;
      } else if (p.radius > f.radius * 1.15) {
        // Smaller: flee the player.
        steerX = (f.x - p.x) / d;
        steerY = (f.y - p.y) / d;
      }
    }
    // Buoyancy: drift back toward home depth so the surface stays a safe nursery.
    steerY += clamp((f.homeY - f.y) / 240, -0.8, 0.8) * 0.6;
    // Bigger fish are slower - the little fish's edge is speed.
    const speed = clamp(170 - f.radius * 1.4, 46, 150);
    const ax = steerX * speed;
    const ay = steerY * speed;
    f.vx += (ax - f.vx) * Math.min(1, dt * 1.5);
    f.vy += (ay - f.vy) * Math.min(1, dt * 1.5);
  }

  /** Combat "power": bigger AND higher-attack fish hit harder. Upgrading attack
   *  lets a small fish out-power a bigger one - the whole point of the upgrade. */
  private powerOf(f: Fish): number {
    return f.value * f.attack;
  }

  // Bidirectional combat: on contact BOTH fish take HP damage AND bite CHUM off each
  // other every moment (scaled by attack). The stronger fish drains faster and steals
  // more - but the weaker one STILL bites off some CHUM. So a small, fast fish can
  // dart in, raid a whale for a few bites, and dart out before its HP hits 0. That is
  // the "small fish can hit a big fish and earn" logic: hit-and-run, powered by speed.
  private resolveCombat(dt: number) {
    const p = this.player;
    if (this.playerGuard > 0 || this.inSafeZone) return; // immunity, or safe in the surface band
    const pPow = this.powerOf(p);
    for (const f of this.fish) {
      if (f.isPlayer || f.dead) continue;
      const d = Math.hypot(f.x - p.x, f.y - p.y);
      if (d > p.radius + f.radius - 4) continue; // not overlapping
      const fPow = this.powerOf(f);
      const pRatio = clamp(pPow / Math.max(fPow, 1), 0.4, 2.5);
      const fRatio = clamp(fPow / Math.max(pPow, 1), 0.4, 2.5);

      // HP damage (both directions; stronger drains faster, victim's defense slows it).
      f.hp -= BLEED_DPS * pRatio * (1 / f.defense) * dt;
      p.hp -= BLEED_DPS * fRatio * (1 / p.defense) * dt;
      f.hurtFlash = 0.5;
      this.player.hurtFlash = 0.5;
      this.player.biteFlash = 0.5;

      // Bites steal only the OTHER fish's un-secured WINNINGS - never its deposit.
      // Capped so a tiny fish can't drain a whale instantly, but it adds up over passes.
      let pBite = f.value * BITE_RATE * p.attack * pRatio * dt;
      pBite = Math.min(pBite, f.winnings, p.value * 1.5 * dt + 1);
      if (pBite > 0) {
        f.value -= pBite;
        f.winnings -= pBite;
        f.radius = radiusFor(f.value);
        this.carried += pBite; // into your at-risk winnings
      }
      // The stronger fish bites YOUR carried winnings - your deposit is untouched.
      let fBite = p.value * BITE_RATE * f.attack * fRatio * dt;
      fBite = Math.min(fBite, this.carried, f.value * 1.5 * dt + 1);
      if (fBite > 0) {
        this.carried -= fBite;
        f.value += fBite;
        f.winnings += fBite;
        f.radius = radiusFor(f.value);
        this.tookDamage = true; // being bitten blocks HP regen
      }
      if (this.biteFxCd <= 0 && (pBite > 0 || fBite > 0)) {
        this.biteFxCd = 0.1;
        if (pBite > 0) this.spawnBurst((p.x + f.x) / 2, (p.y + f.y) / 2, 2, "rgba(146,200,175,0.8)");
        if (fBite > 0) {
          this.spawnBurst(p.x, p.y, 3, "rgba(214,90,66,0.85)");
          this.shake = Math.min(1.2, this.shake + 0.22);
        }
      }
      this.syncPlayerSize();

      if (f.hp <= 0) {
        this.playerEats(f); // finish it - take whatever winnings remain
        continue;
      }
      if (p.hp <= 0) {
        this.playerTakedown(f);
        return;
      }
    }
  }

  private playerEats(f: Fish) {
    f.dead = true;
    const isBounty = f === this.bountyFish;
    const bigFish = tierFor(f.value) >= 5;
    let gain = f.winnings; // you take its winnings (CHUM); its deposit is untouched
    this.player.biteFlash = 1;
    this.sound.chomp();

    // combo: chain eats within the window for a multiplier
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.comboTimer = COMBO_WINDOW;
    const comboMult = 1 + Math.min(this.combo - 1, 5) * 0.1; // up to +50%

    if (gain > 0) {
      if (isBounty) gain *= BOUNTY_BONUS;
      gain = Math.round(gain * comboMult);
      this.carried += gain;
      this.syncPlayerSize();
      this.spawnBurst(f.x, f.y, isBounty || bigFish ? 24 : 12, "rgba(146,200,175,0.95)", bigFish ? 1.7 : 1);
      this.addFloater(
        f.x,
        f.y - f.radius,
        `+${fmt(gain)}${this.combo > 1 ? ` x${this.combo}` : ""}`,
        isBounty ? "#C9A24A" : "#7FB39B",
        bigFish || isBounty,
      );
      this.shake = Math.min(1.4, this.shake + (bigFish ? 1.1 : 0.4) + (isBounty ? 0.5 : 0));
      if (isBounty) {
        this.bountyFish = null;
        this.sound.bigWin();
        this.setMsg(`Bounty down. +${fmt(gain)} CHUM.`);
      } else if (bigFish) {
        this.sound.bigWin();
        this.setMsg(`Took down a ${tierNameOf(f.value)}. +${fmt(gain)} CHUM.`);
      } else {
        this.sound.win();
        this.setMsg(`+${fmt(gain)} CHUM${this.combo > 1 ? ` (x${this.combo} combo)` : ""}. Surface to secure.`);
      }
    } else {
      this.spawnBurst(f.x, f.y, 6, "rgba(255,255,255,0.5)");
      this.setMsg(`Ate a ${tierNameOf(f.value)}. No winnings.`);
    }
  }

  /** Secure this dive's winnings into your safe deposit. Only works in the surface
   *  safe zone. After this, the winnings can never be lost - dive again for more. */
  secureWinnings() {
    if (!this.inSafeZone || this.carried <= 0) return;
    const amt = this.carried;
    this.deposit += amt;
    this.carried = 0;
    this.syncPlayerSize();
    this.sound.secure();
    this.addFloater(this.player.x, this.player.y - this.player.radius, `Secured ${fmt(amt)}`, "#5FA383", true);
    this.setMsg(`Secured ${fmt(amt)} CHUM into your deposit. Safe for good. Dive for more.`);
  }

  /** Cash out from the deposit to the wallet (used by the dashboard). Keeps a Spawn seed. */
  withdraw() {
    if (this.deposit <= WITHDRAW_RESET) return;
    const taken = this.deposit - WITHDRAW_RESET;
    this.chum += taken;
    this.deposit = WITHDRAW_RESET;
    this.syncPlayerSize();
    this.setMsg(`Withdrew ${fmt(taken)} CHUM to your wallet.`);
  }

  /** Taken down by a stronger fish: it takes your remaining CARRIED winnings (your
   *  deposit is always safe), knocks you back, and gives a moment of immunity. */
  private playerTakedown(by: Fish) {
    const p = this.player;
    const taken = Math.max(0, this.carried); // only un-secured winnings are lost
    this.carried = 0;

    // Winnings transfer to the attacker.
    by.winnings += taken;
    by.value += taken;
    by.radius = radiusFor(by.value);
    by.biteFlash = 1;

    // Knockback + partial HP recovery + brief immunity so it isn't a death spiral.
    const ang = Math.atan2(p.y - by.y, p.x - by.x);
    p.vx += Math.cos(ang) * 260;
    p.vy += Math.sin(ang) * 260;
    p.hp = MAX_HP * 0.6;
    this.playerGuard = TAKEDOWN_IMMUNITY;
    this.takedownFlash = 1;
    this.spawnBurst(p.x, p.y, 20, "rgba(214,90,66,0.9)", 1.5);
    if (taken > 0.5) this.addFloater(p.x, p.y - p.radius, `-${fmt(taken)}`, "#D65A42", true);
    this.shake = Math.min(1.9, this.shake + 1.4);
    this.sound.hurt();
    this.combo = 0;
    this.comboTimer = 0;
    this.syncPlayerSize();

    const pred = tierNameOf(by.value);
    const art = /^[AEIOU]/.test(pred) ? "an" : "a";
    this.setMsg(
      taken > 0.01
        ? `Taken down by ${art} ${pred} - lost ${fmt(taken)} CHUM of un-secured winnings. Your deposit is safe. Secure sooner next time.`
        : `Taken down by ${art} ${pred}. Your deposit is safe - you had no un-secured winnings.`,
    );
  }

  upgradeAttack() {
    const cost = upgradeCost(this.attackLvl);
    if (this.chum < cost) return;
    this.spendChum(cost);
    this.attackLvl += 1;
    this.player.attack = 1 + ATTACK_PER_LVL * this.attackLvl;
    this.setMsg(`Attack → Lv ${this.attackLvl}. Burned ${fmt(cost * 0.9)} CHUM, ${fmt(cost * 0.1)} to the weekly pool.`);
  }

  upgradeDefense() {
    const cost = upgradeCost(this.defenseLvl);
    if (this.chum < cost) return;
    this.spendChum(cost);
    this.defenseLvl += 1;
    this.player.defense = 1 + DEFENSE_PER_LVL * this.defenseLvl;
    this.setMsg(`Defense → Lv ${this.defenseLvl}. Burned ${fmt(cost * 0.9)} CHUM, ${fmt(cost * 0.1)} to the weekly pool.`);
  }

  private spendChum(cost: number) {
    this.chum -= cost;
    this.chumBurned += cost * 0.9; // 90% burned
    this.leaderboardPool += cost * 0.1; // 10% to the weekly leaderboard pool
  }

  private resolveBotEatBot() {
    // A clearly-bigger bot eats a much-smaller bot on contact, so the ocean feels alive.
    for (const a of this.fish) {
      if (a.isPlayer || a.dead || a.radius < 16) continue;
      for (const b of this.fish) {
        if (b === a || b.isPlayer || b.dead) continue;
        if (a.radius < b.radius * 1.4) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius - 4) {
          b.dead = true;
          // Winnings transfer to the eater; the prey's deposit is safe (leaves play).
          a.winnings += b.winnings;
          a.value += b.winnings;
          a.radius = radiusFor(a.value);
          a.biteFlash = 1;
          break;
        }
      }
    }
  }

  respawn() {
    if (!this.player.dead) return;
    this.spawnPlayer(); // spawns shallow, with immunity
    this.syncPlayerSize();
    this.setMsg("Back in the water - safe for a moment.");
  }

  private setMsg(m: string) {
    this.message = m;
    this.msgTimer = 3.5;
  }

  private depthLabel(y: number): string {
    if (y < this.surfaceY + 40) return "Surface";
    if (y < this.worldH * 0.45) return "Twilight";
    return "The Deep";
  }

  private computeThreat(): { zone: ThreatZone; label: string; targetTier: string } {
    const p = this.player;
    if (p.dead) return { zone: "none", label: "", targetTier: "" };
    // Nearest fish of any size within reaction range; classify purely by size.
    let best: Fish | null = null;
    let bestD = 1e9;
    for (const f of this.fish) {
      if (f.isPlayer || f.dead) continue;
      const d = Math.hypot(f.x - p.x, f.y - p.y);
      if (d < f.radius + 150 && d < bestD) {
        bestD = d;
        best = f;
      }
    }
    if (!best) return { zone: "none", label: "", targetTier: "" };
    const tier = tierNameOf(best.value);
    const pPow = this.powerOf(p);
    const fPow = this.powerOf(best);
    if (fPow > pPow * 1.05) {
      return { zone: "danger", label: "stronger - flee or upgrade", targetTier: tier };
    }
    if (pPow > fPow * 1.05) {
      const label = best.winnings > 0 ? `weaker - take $${fmt(best.winnings)}` : "weaker - but no winnings";
      return { zone: "payday", label, targetTier: tier };
    }
    return { zone: "clear", label: "even fight - risky", targetTier: tier };
  }

  getHud(): Hud {
    const p = this.player;
    return {
      tier: tierFor(p.value),
      tierName: tierNameOf(p.value),
      deposit: this.deposit,
      carried: this.carried,
      wallet: this.chum,
      canSecure: this.inSafeZone && this.carried > 0.5,
      safeZone: this.inSafeZone,
      size: p.value,
      hp: clamp(p.hp / MAX_HP, 0, 1),
      chum: this.chum,
      attackLvl: this.attackLvl,
      defenseLvl: this.defenseLvl,
      attackCost: upgradeCost(this.attackLvl),
      defenseCost: upgradeCost(this.defenseLvl),
      chumBurned: this.chumBurned,
      leaderboardPool: this.leaderboardPool,
      depthLabel: this.depthLabel(p.y),
      guard: this.playerGuard,
      alive: !p.dead,
      message: this.message,
      fishAlive: this.fish.filter((f) => !f.isPlayer && !f.dead).length,
      threat: this.computeThreat(),
      combo: this.comboTimer > 0 ? this.combo : 0,
      dashReady: clamp(1 - this.dashCd / DASH_COOLDOWN, 0, 1),
      frenzy: this.frenzyActive > 0,
      frenzyBanner: this.frenzyBannerT > 0,
      muted: this.sound.muted,
    };
  }

  // Convert a screen point to world coords (for pointer input).
  screenToWorld(sx: number, sy: number) {
    return { x: sx, y: sy + this.cameraY };
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  private render() {
    const ctx = this.ctx;
    const cam = this.cameraY;

    // Screen shake: nudge the whole scene by a small random offset.
    ctx.save();
    if (this.shake > 0.01) {
      const s = this.shake * 8;
      ctx.translate((this.rnd() - 0.5) * s, (this.rnd() - 0.5) * s);
    }

    // Water: depth gradient (pale surface -> deep ocean ink). Slightly over-drawn so
    // the shake offset never reveals an edge.
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    const topShade = shadeAtDepth(cam);
    const botShade = shadeAtDepth(cam + this.H);
    g.addColorStop(0, topShade);
    g.addColorStop(1, botShade);
    ctx.fillStyle = g;
    ctx.fillRect(-14, -14, this.W + 28, this.H + 28);

    // Sunlight god-rays from the surface - soft, slowly drifting, fading with depth.
    const surfaceOnScreen = this.surfaceY - cam;
    const rayFade = clamp(1 - cam / 1400, 0.12, 1); // dimmer the deeper the camera
    if (rayFade > 0.12) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const baseX = ((i + 0.5) / 5) * this.W + Math.sin(this.t * 0.12 + i) * 60;
        const w = 60 + i * 14;
        const topY = Math.max(-40, surfaceOnScreen);
        const grd = ctx.createLinearGradient(0, topY, 0, topY + this.H);
        grd.addColorStop(0, `rgba(200,236,238,${0.06 * rayFade})`);
        grd.addColorStop(1, "rgba(200,236,238,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(baseX - w * 0.4, topY);
        ctx.lineTo(baseX + w * 0.4, topY);
        ctx.lineTo(baseX + w * 1.4, topY + this.H);
        ctx.lineTo(baseX - w * 1.4, topY + this.H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Seabed, plants, and ambient creatures (behind the fish).
    this.drawDecor(cam);

    // Six tier bands (Spawn near the surface -> Leviathan in the deep). This is the
    // map: the player reads depth to decide whether to rise (safer) or dive
    // (bigger fish, bigger paydays).
    ctx.save();
    ctx.font = "600 12px ui-monospace, 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    const top = this.surfaceY;
    const span = this.worldH - top;
    for (let i = 0; i < 6; i++) {
      const bandTop = top + (i / 6) * span;
      const syTop = bandTop - cam;
      // separator line
      if (i > 0 && syTop > -20 && syTop < this.H + 20) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, syTop);
        ctx.lineTo(this.W, syTop);
        ctx.stroke();
      }
      // band label (left gutter)
      const labelY = top + ((i + 0.5) / 6) * span - cam;
      if (labelY > 12 && labelY < this.H - 6) {
        ctx.fillStyle = i >= 4 ? "rgba(198,169,120,0.5)" : "rgba(255,255,255,0.22)";
        ctx.fillText(TIER_NAMES[i].toUpperCase(), 10, labelY);
      }
    }
    ctx.restore();

    // Surface safe band.
    const surfSy = this.surfaceY - cam;
    if (surfSy > -60 && surfSy < this.H + 60) {
      ctx.save();
      const sg = ctx.createLinearGradient(0, surfSy - 120, 0, surfSy);
      sg.addColorStop(0, "rgba(231,240,241,0.55)");
      sg.addColorStop(1, "rgba(231,240,241,0.0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, surfSy - 120, this.W, 120);
      ctx.strokeStyle = "rgba(14,77,164,0.35)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, surfSy);
      ctx.lineTo(this.W, surfSy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(14,77,164,0.7)";
      ctx.font = "11px ui-monospace, 'IBM Plex Mono', monospace";
      ctx.fillText("SURFACE. Safe zone. Secure winnings here.", 10, surfSy - 8);
      ctx.restore();
    }

    // Drifting bubbles (behind the fish).
    ctx.save();
    ctx.fillStyle = "rgba(226,244,245,0.28)";
    for (const b of this.bubbles) {
      const by = b.y - cam;
      if (by < -6 || by > this.H + 6) continue;
      ctx.beginPath();
      ctx.arc(b.x, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Fish, small (far) first.
    const sorted = [...this.fish].filter((f) => !f.dead).sort((a, b) => a.radius - b.radius);
    for (const f of sorted) this.drawFish(f, cam);

    // Spawn-immunity ring.
    if (this.playerGuard > 0 && !this.player.dead) {
      const p = this.player;
      const sy = p.y - cam;
      ctx.save();
      ctx.strokeStyle = "rgba(14,77,164,0.8)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, sy, p.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Takedown flash - brief red vignette for impact.
    if (this.takedownFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(194,69,45,${0.28 * this.takedownFlash})`;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();
    }

    // Safe-zone ring around the player when in the surface band.
    if (this.inSafeZone && !this.player.dead) {
      const p = this.player;
      const sy = p.y - cam;
      ctx.save();
      ctx.strokeStyle = "rgba(30,107,79,0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(p.x, sy, p.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Particles
    for (const pt of this.particles) {
      const sy = pt.y - cam;
      if (sy < -20 || sy > this.H + 20) continue;
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, sy - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Floating numbers
    for (const fl of this.floaters) {
      const sy = fl.y - cam;
      if (sy < -20 || sy > this.H + 20) continue;
      ctx.globalAlpha = clamp(fl.life, 0, 1);
      ctx.font = `600 ${fl.big ? 15 : 12}px ui-monospace, 'IBM Plex Mono', monospace`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(6,20,32,0.6)";
      ctx.strokeText(fl.text, fl.x, sy);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fl.x, sy);
    }
    ctx.globalAlpha = 1;

    // Feeding-frenzy warm tint over the whole scene while active.
    if (this.frenzyActive > 0) {
      ctx.fillStyle = `rgba(198,169,120,${0.06 + 0.04 * Math.sin(this.t * 6)})`;
      ctx.fillRect(-14, -14, this.W + 28, this.H + 28);
    }

    ctx.restore(); // end screen shake
  }

  private drawDecor(cam: number) {
    const ctx = this.ctx;
    const bedSy = this.seabedY - cam;

    // Seabed
    if (bedSy < this.H) {
      const top = Math.max(0, bedSy);
      ctx.fillStyle = "#0a2233";
      ctx.fillRect(0, top, this.W, this.H - top + 2);
      if (bedSy > -4 && bedSy < this.H) {
        ctx.fillStyle = "rgba(200,185,137,0.10)";
        ctx.fillRect(0, bedSy, this.W, 3);
      }
    }

    // Seaweed (swaying kelp)
    const palettes = [
      ["#3a5c4e", "#4E7367"],
      ["#38564C", "#4a6b5c"],
      ["#455f3f", "#57785a"],
    ];
    for (const w of this.seaweed) {
      const cols = palettes[Math.floor(w.hue * 3) % 3];
      for (let bl = 0; bl < w.blades; bl++) {
        const bx0 = w.x + (bl - (w.blades - 1) / 2) * 4;
        for (let seg = 0; seg < w.h; seg += 4) {
          const sy = this.seabedY - seg - cam;
          if (sy < -8 || sy > this.H + 8) continue;
          const sway = Math.sin(this.t * 1.1 + w.phase + seg * 0.06) * (seg / w.h) * 9;
          ctx.fillStyle = seg % 8 === 0 ? cols[0] : cols[1];
          ctx.fillRect(Math.round(bx0 + sway), Math.round(sy), 4, 4);
        }
      }
    }

    // Snails on the seabed
    for (const s of this.snails) {
      const sy = bedSy - 5;
      if (sy < -10 || sy > this.H + 10) continue;
      ctx.save();
      ctx.translate(Math.round(s.x), Math.round(sy));
      if (s.dir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#8C7F63";
      ctx.fillRect(-5, 3, 9, 3);
      ctx.fillRect(4, 0, 2, 4);
      ctx.fillStyle = "#665C46";
      ctx.beginPath();
      ctx.arc(-1, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#CBC2A6";
      ctx.beginPath();
      ctx.arc(-1, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const c of this.critters) {
      if (c.kind === "octopus") this.drawOctopus(c, cam);
      else this.drawTurtle(c, cam);
    }
  }

  private drawOctopus(c: { x: number; y: number }, cam: number) {
    const ctx = this.ctx;
    const sy = c.y - cam;
    if (sy < -30 || sy > this.H + 30) return;
    ctx.fillStyle = "#5C3A50";
    for (let i = 0; i < 6; i++) {
      const tx = c.x - 12 + i * 5;
      for (let seg = 0; seg < 12; seg += 3) {
        const wave = Math.sin(this.t * 2 + i + seg * 0.4) * 2.5;
        ctx.fillRect(Math.round(tx + wave), Math.round(sy + 6 + seg), 3, 3);
      }
    }
    ctx.fillStyle = "#7A4E6B";
    ctx.beginPath();
    ctx.ellipse(c.x, sy, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F7F8F6";
    ctx.beginPath();
    ctx.arc(c.x - 4, sy - 1, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x + 4, sy - 1, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10222E";
    ctx.beginPath();
    ctx.arc(c.x - 4, sy - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x + 4, sy - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTurtle(c: { x: number; y: number; vx: number; phase: number }, cam: number) {
    const ctx = this.ctx;
    const bob = Math.sin(this.t * 0.6 + c.phase) * 5;
    const sy = c.y - cam + bob;
    if (sy < -30 || sy > this.H + 30) return;
    ctx.save();
    ctx.translate(c.x, sy);
    if (c.vx < 0) ctx.scale(-1, 1);
    const flap = Math.sin(c.phase * 3) * 3;
    ctx.fillStyle = "#6B7D52";
    ctx.beginPath();
    ctx.ellipse(-6, -6 + flap, 6, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, 6 - flap, 6, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 5 - flap, 5, 2.6, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(13, -1, 4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10222E";
    ctx.beginPath();
    ctx.arc(15, -2, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4E6B3A";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38502a";
    ctx.fillRect(-2, -4, 4, 4);
    ctx.fillRect(-8, -1, 4, 3);
    ctx.fillRect(4, -1, 4, 3);
    ctx.fillRect(-2, 2, 4, 4);
    ctx.restore();
  }

  private drawFish(f: Fish, cam: number) {
    const ctx = this.ctx;
    const sy = f.y - cam;
    if (sy < -90 || sy > this.H + 90) return;

    const sil = SILHOUETTES[tierFor(f.value)] ?? SILHOUETTES[1];
    const rows = sil.length;
    const cols = Math.max(...sil.map((r) => r.length));
    const cell = (f.radius * 2.7) / cols; // fish width ~ 2.7 * radius
    const w = cols * cell;
    const h = rows * cell;
    const pal = paletteFor(f);
    const gold = f.value >= TIER_MIN[4];
    const hurt = f.hurtFlash > 0;
    const bob = Math.sin(f.tailPhase) * cell * 0.35; // gentle vertical bob (life, not flip)

    ctx.save();
    ctx.translate(f.x, sy + bob);
    // Silhouettes face LEFT. Mirror to face travel direction. NO rotation, so a
    // fish is never upside-down - it just faces left or right, belly always down.
    const faceRight = Math.cos(f.angle) >= 0;
    if (faceRight) ctx.scale(-1, 1);

    const x0 = -w / 2;
    const y0 = -h / 2;
    for (let r = 0; r < rows; r++) {
      const row = sil[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        let color: string;
        switch (ch) {
          case "s":
            color = pal.belly;
            break;
          case "d":
          case "f":
            color = pal.dark;
            break;
          case "e":
            color = "#F7F8F6";
            break;
          case "p":
            color = "#10222E";
            break;
          case "j":
            color = "#F7F8F6";
            break;
          case "g":
            color = gold ? "#8A6D2F" : pal.dark;
            break;
          default:
            color = pal.body;
        }
        if (hurt && ch !== "e" && ch !== "p") color = "#C2452D";
        ctx.fillStyle = color;
        ctx.fillRect(x0 + c * cell, y0 + r * cell, cell + 0.7, cell + 0.7);
      }
    }
    ctx.restore();

    // Player highlight ring (screen space, so it never mirrors).
    if (f.isPlayer && !f.dead) {
      ctx.save();
      ctx.strokeStyle = "rgba(14,77,164,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(f.x, sy + bob, w * 0.6, h * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // HP bar for any fish currently in a fight (hp below full).
    if (f.hp < MAX_HP && f.hp > 0) {
      const bw = Math.max(20, f.radius * 1.5);
      const bx = f.x - bw / 2;
      const by = sy - h * 0.6 - 15;
      const frac = clamp(f.hp / MAX_HP, 0, 1);
      ctx.save();
      ctx.fillStyle = "rgba(16,34,46,0.5)";
      ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = frac > 0.5 ? "#5FA383" : frac > 0.25 ? "#C9A24A" : "#D65A42";
      ctx.fillRect(bx, by, bw * frac, 3);
      ctx.restore();
    }

    // Bounty highlight: a pulsing gold ring and label on the marked fish.
    if (f === this.bountyFish && !f.dead) {
      const pulse = 0.55 + 0.45 * Math.sin(this.t * 6);
      ctx.save();
      ctx.strokeStyle = `rgba(200,162,74,${pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(f.x, sy + bob, w * 0.72, h * 0.82, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#C9A24A";
      ctx.font = "600 10px ui-monospace, 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("BOUNTY", f.x, sy - h * 0.6 - 16);
      ctx.restore();
    }

    // Tag: the player shows its size; other fish show their WINNINGS (what you'd
    // gain by eating them). Fish with no winnings are unlabeled - not worth eating.
    ctx.save();
    ctx.font = "600 11px ui-monospace, 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    if (f.isPlayer) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(`${fmt(f.value)} CHUM`, f.x, sy - h * 0.6 - 4);
    } else if (f.winnings > 0) {
      ctx.fillStyle = "rgba(146,200,175,0.95)"; // light kelp - this fish is worth eating
      ctx.fillText(`+${fmt(f.winnings)} CHUM`, f.x, sy - h * 0.6 - 4);
    }
    ctx.restore();
  }
}

// Water shade at a given world depth (0 surface .. worldH deep): bright sunlit
// teal at the surface deepening through ocean blue to near-black in the deep.
function shadeAtDepth(worldY: number): string {
  const t = clamp(worldY / 2600, 0, 1);
  const e = Math.pow(t, 0.85); // darken a touch faster with depth
  const top = [126, 194, 198]; // sunlit teal
  const mid = [30, 96, 130]; // ocean blue
  const bot = [6, 24, 40]; // the deep
  let r: number, g: number, b: number;
  if (e < 0.5) {
    const k = e / 0.5;
    r = top[0] + (mid[0] - top[0]) * k;
    g = top[1] + (mid[1] - top[1]) * k;
    b = top[2] + (mid[2] - top[2]) * k;
  } else {
    const k = (e - 0.5) / 0.5;
    r = mid[0] + (bot[0] - mid[0]) * k;
    g = mid[1] + (bot[1] - mid[1]) * k;
    b = mid[2] + (bot[2] - mid[2]) * k;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function paletteFor(f: Fish): { body: string; dark: string; belly: string } {
  if (f.isPlayer) return { body: "#3E7CC0", dark: "#245C9A", belly: "#CFE0F0" };
  const sets = [
    { body: "#46687F", dark: "#324E61", belly: "#A9BDC7" }, // slate
    { body: "#4E7367", dark: "#38564C", belly: "#AEC4B8" }, // kelp
    { body: "#8C7F63", dark: "#665C46", belly: "#CBC2A6" }, // sand
  ];
  const base = sets[Math.floor(f.hue * sets.length) % sets.length];
  if (f.value >= TIER_MIN[4]) return { body: "#6E5A2E", dark: "#4A3D1E", belly: "#C8B989" }; // leviathan/orca gold-brown
  return base;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
