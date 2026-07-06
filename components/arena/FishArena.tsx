"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ArenaGame, type Hud } from "./game";

const EMPTY_HUD: Hud = {
  tier: 1,
  tierName: "Spawn",
  deposit: 50,
  carried: 0,
  wallet: 500,
  canSecure: false,
  safeZone: false,
  size: 50,
  hp: 1,
  chum: 500,
  attackLvl: 0,
  defenseLvl: 0,
  attackCost: 100,
  defenseCost: 100,
  chumBurned: 0,
  leaderboardPool: 0,
  depthLabel: "Twilight",
  guard: 0,
  alive: true,
  message: "",
  fishAlive: 0,
  threat: { zone: "none", label: "", targetTier: "" },
  combo: 0,
  dashReady: 1,
  frenzy: false,
  frenzyBanner: false,
  muted: false,
};

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function FishArena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ArenaGame | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [started, setStarted] = useState(false);
  const [fs, setFs] = useState(false);
  const [muted, setMuted] = useState(false);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const onFsChange = () => {
      setFs(!!document.fullscreenElement);
      // Let layout settle, then resize the canvas to the new box.
      requestAnimationFrame(() => gameRef.current?.resize());
      setTimeout(() => gameRef.current?.resize(), 120);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let game: ArenaGame;
    try {
      game = new ArenaGame(canvas);
    } catch {
      return;
    }
    gameRef.current = game;
    game.start();
    // Safety: re-measure once the flex layout has settled.
    requestAnimationFrame(() => game.resize());

    const onResize = () => game.resize();
    window.addEventListener("resize", onResize);

    // ---- Keyboard ----
    const keys = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (down) game.ensureAudio();
      const i = game.input;
      let hit = true;
      if (k === "w" || k === "arrowup") i.up = down;
      else if (k === "s" || k === "arrowdown") i.down = down;
      else if (k === "a" || k === "arrowleft") i.left = down;
      else if (k === "d" || k === "arrowright") i.right = down;
      else if (k === " " || k === "shift") {
        if (down) game.dash();
      } else hit = false;
      if (hit) e.preventDefault();
    };
    const kd = (e: KeyboardEvent) => keys(e, true);
    const ku = (e: KeyboardEvent) => keys(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // ---- Pointer / touch (steer toward finger/cursor while held) ----
    const setPointer = (clientX: number, clientY: number, active: boolean) => {
      const rect = canvas.getBoundingClientRect();
      const w = game.screenToWorld(clientX - rect.left, clientY - rect.top);
      game.input.pointerActive = active;
      game.input.pointerX = w.x;
      game.input.pointerY = w.y;
    };
    const pd = (e: PointerEvent) => {
      game.ensureAudio();
      canvas.setPointerCapture?.(e.pointerId);
      setPointer(e.clientX, e.clientY, true);
    };
    const pm = (e: PointerEvent) => {
      if (game.input.pointerActive || e.pointerType === "mouse") {
        setPointer(e.clientX, e.clientY, e.pointerType === "mouse" ? game.input.pointerActive : true);
      }
    };
    const pu = () => {
      game.input.pointerActive = false;
    };
    canvas.addEventListener("pointerdown", pd);
    canvas.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    canvas.addEventListener("pointerleave", pu);

    // ---- HUD poll (throttled; the canvas renders at full rate itself) ----
    let hudRaf = 0;
    let acc = 0;
    let prev = performance.now();
    const pollHud = (t: number) => {
      acc += t - prev;
      prev = t;
      if (acc > 90) {
        acc = 0;
        setHud(game.getHud());
      }
      hudRaf = requestAnimationFrame(pollHud);
    };
    hudRaf = requestAnimationFrame(pollHud);
    setStarted(true);

    return () => {
      game.stop();
      cancelAnimationFrame(hudRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("pointerup", pu);
      canvas.removeEventListener("pointerdown", pd);
      canvas.removeEventListener("pointermove", pm);
      canvas.removeEventListener("pointerleave", pu);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col overflow-hidden border border-hairline bg-porcelain",
        fs ? "h-screen w-screen rounded-none" : "h-[88vh] min-h-[560px] rounded-lg",
      )}
    >
      {/* Toolbar - above the water, so nothing blocks the river */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline bg-porcelain px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("font-display text-sm", hud.tier >= 5 ? "text-gold" : "text-ink")}>
            {hud.tierName}
          </span>
          <span className="font-mono text-[11px] text-tide">
            Tier {hud.tier} · size {money(hud.size)} CHUM
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <BarStat label="Deposit" value={hud.deposit} hint="safe" tone="safe" />
          <BarStat
            label="Winnings"
            value={hud.carried}
            hint={hud.safeZone ? "safe now" : "at risk"}
            tone={hud.safeZone ? "kelp" : "coral"}
          />
          {hud.safeZone && (
            <span className="rounded-full border border-kelp/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-kelp">
              Safe zone
            </span>
          )}
          <HpBar hp={hud.hp} />
          <DashPill ready={hud.dashReady} />
          {hud.combo > 1 && (
            <span className="rounded-full border border-gold/50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-gold">
              x{hud.combo} combo
            </span>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {hud.alive && hud.threat.zone !== "none" && (
            <ThreatChip zone={hud.threat.zone} label={hud.threat.label} tier={hud.threat.targetTier} />
          )}
          <UpgradeButton
            label="Atk"
            lvl={hud.attackLvl}
            cost={hud.attackCost}
            canAfford={hud.chum >= hud.attackCost}
            onClick={() => gameRef.current?.upgradeAttack()}
          />
          <UpgradeButton
            label="Def"
            lvl={hud.defenseLvl}
            cost={hud.defenseCost}
            canAfford={hud.chum >= hud.defenseCost}
            onClick={() => gameRef.current?.upgradeDefense()}
          />
          {hud.canSecure && (
            <button
              type="button"
              onClick={() => gameRef.current?.secureWinnings()}
              className="rounded-md border border-kelp bg-kelp/10 px-2.5 py-1 font-mono text-[11px] text-kelp outline-none transition-colors hover:bg-kelp/20 focus-visible:ring-2 focus-visible:ring-kelp"
              title="Move this dive's winnings into your safe deposit - they can never be lost after this"
            >
              Secure {money(hud.carried)} winnings
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              gameRef.current?.ensureAudio();
              setMuted(gameRef.current?.toggleMute() ?? false);
            }}
            className="rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-md border border-hairline px-2.5 py-1 font-mono text-[11px] text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
            aria-label={fs ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fs ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* The river - clean, nothing overlaps except transient game feedback */}
      <div className="relative flex-1 bg-ink">
        <canvas
          ref={canvasRef}
          className="block h-full w-full touch-none select-none"
          aria-label="Feeding Frenzy swimming arena"
        />

        {hud.frenzyBanner && (
          <div className="pointer-events-none absolute inset-x-0 top-8 flex flex-col items-center">
            <div className="font-display text-3xl font-semibold uppercase tracking-[0.2em] text-gold drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              Feeding Frenzy
            </div>
            <div className="mt-1 font-mono text-xs text-porcelain/80">Winnings everywhere. Dive in.</div>
          </div>
        )}
        {hud.frenzy && !hud.frenzyBanner && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-gold/50 bg-ink/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
            Frenzy on
          </div>
        )}
      </div>

      {/* Bottom strip - controls + latest event, also outside the river */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-hairline bg-porcelain px-3 py-2">
        <span className="font-mono text-[11px] text-tide">
          {started ? "Swim WASD or drag · Space to dash · bite fish for CHUM · chain eats for combos · surface is safe, Secure there" : "loading…"}
        </span>
        <div className="flex items-center gap-3">
          {hud.message && <span className="font-mono text-[11px] text-ink">{hud.message}</span>}
          <Link
            href="/rules"
            className="shrink-0 rounded-md border border-depth/40 px-2.5 py-1 font-mono text-[11px] text-depth outline-none transition-colors hover:bg-depth/10 focus-visible:ring-2 focus-visible:ring-depth"
          >
            How to play
          </Link>
        </div>
      </div>
    </div>
  );
}

function ThreatChip({
  zone,
  label,
  tier,
}: {
  zone: "danger" | "payday" | "clear";
  label: string;
  tier: string;
}) {
  const s = {
    danger: { dot: "bg-coral", text: "text-coral", border: "border-coral/50" },
    payday: { dot: "bg-kelp", text: "text-kelp", border: "border-kelp/50" },
    clear: { dot: "bg-tide", text: "text-tide", border: "border-hairline" },
  }[zone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5", s.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      <span className={cn("font-mono text-[11px]", s.text)}>
        {tier}: {label}
      </span>
    </span>
  );
}

function DashPill({ ready }: { ready: number }) {
  const isReady = ready >= 0.999;
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title="Press Space or Shift to dash. Recharges over a few seconds."
    >
      <span className={cn("font-mono text-[10px] uppercase tracking-wide", isReady ? "text-depth" : "text-tide")}>
        Dash
      </span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-hairline">
        <span
          className={cn("block h-full rounded-full", isReady ? "bg-depth" : "bg-tide/60")}
          style={{ width: `${Math.round(clampPct(ready) * 100)}%` }}
        />
      </span>
    </span>
  );
}

function HpBar({ hp }: { hp: number }) {
  const color = hp > 0.5 ? "bg-kelp" : hp > 0.25 ? "bg-gold" : "bg-coral";
  return (
    <span className="inline-flex items-center gap-1.5" title="Health - drops in a fight, refills when you break away">
      <span className="font-mono text-[10px] uppercase tracking-wide text-tide">HP</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-hairline">
        <span
          className={cn("block h-full rounded-full transition-[width] duration-150", color)}
          style={{ width: `${Math.round(clampPct(hp) * 100)}%` }}
        />
      </span>
    </span>
  );
}

function clampPct(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function UpgradeButton({
  label,
  lvl,
  cost,
  canAfford,
  onClick,
}: {
  label: string;
  lvl: number;
  cost: number;
  canAfford: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canAfford}
      className="rounded-md border border-depth/40 px-2.5 py-1 font-mono text-[11px] text-depth outline-none transition-colors hover:bg-depth/10 focus-visible:ring-2 focus-visible:ring-depth disabled:cursor-not-allowed disabled:border-hairline disabled:text-tide/50"
      title={`Spend ${cost.toLocaleString()} CHUM - 90% burned, 10% to the weekly leaderboard pool`}
    >
      {label} L{lvl} · {cost.toLocaleString()}
    </button>
  );
}

function BarStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "coral" | "kelp" | "safe";
}) {
  const color = tone === "coral" ? "text-coral" : tone === "kelp" ? "text-kelp" : "text-ink";
  const hintColor = tone === "coral" ? "text-coral" : "text-tide";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-tide">{label}</span>
      <span className={cn("font-mono text-sm", color)}>{money(value)}</span>
      <span className={cn("font-mono text-[9px] uppercase", hintColor)}>{hint}</span>
    </span>
  );
}
