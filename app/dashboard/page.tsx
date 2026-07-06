"use client";

import Link from "next/link";
import { useState } from "react";
import { PixelFish } from "@/components/dashboard/PixelFish";
import { TIER_MIN, TIER_NAMES, tierFor } from "@/components/arena/game";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const WITHDRAW_RESET = 20;
const upgradeCost = (lvl: number) => 100 * (lvl + 1);

// Mock leaderboard (weekly).
const LEADERBOARD = [
  { rank: 1, id: 7, tier: 6, name: "Leviathan", won: 41250 },
  { rank: 2, id: 512, tier: 6, name: "Leviathan", won: 33810 },
  { rank: 3, id: 88, tier: 5, name: "Orca", won: 21440 },
  { rank: 4, id: 1337, tier: 3, name: "Barracuda", won: 15990, you: true },
  { rank: 5, id: 2201, tier: 4, name: "Shark", won: 12500 },
  { rank: 6, id: 903, tier: 4, name: "Shark", won: 9800 },
];

export default function Dashboard() {
  // Mock on-chain state for this wallet's fish (#1337).
  const [staked, setStaked] = useState(640);
  const [wallet, setWallet] = useState(860);
  const [atkLvl, setAtkLvl] = useState(2);
  const [defLvl, setDefLvl] = useState(1);
  const [burned, setBurned] = useState(128000);
  const [pool, setPool] = useState(4200);
  const [taken, setTaken] = useState(0);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [streak, setStreak] = useState(4);

  const claimDaily = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    setStreak((s) => s + 1);
    setWallet((w) => w + 250);
  };

  const tier = tierFor(staked);
  const tierName = TIER_NAMES[tier - 1];
  const nextMin = tier < 6 ? TIER_MIN[tier] : null;
  const progress = nextMin ? Math.min(1, (staked - TIER_MIN[tier - 1]) / (nextMin - TIER_MIN[tier - 1])) : 1;

  const atkCost = upgradeCost(atkLvl);
  const defCost = upgradeCost(defLvl);
  const atkMult = 1 + 0.15 * atkLvl;
  const defMult = 1 + 0.18 * defLvl;

  const spend = (cost: number) => {
    setWallet((w) => w - cost);
    setBurned((b) => b + cost * 0.9);
    setPool((p) => p + cost * 0.1);
  };
  const upAtk = () => wallet >= atkCost && (spend(atkCost), setAtkLvl((l) => l + 1));
  const upDef = () => wallet >= defCost && (spend(defCost), setDefLvl((l) => l + 1));
  const withdraw = () => {
    if (staked <= WITHDRAW_RESET) return;
    const amt = staked - WITHDRAW_RESET;
    setWallet((w) => w + amt);
    setTaken((t) => t + amt);
    setStaked(WITHDRAW_RESET);
  };
  const deposit = () => {
    if (wallet < 50) return;
    setWallet((w) => w - 50);
    setStaked((s) => s + 50);
  };

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 font-mono text-xs text-tide">Fish #1337 · connected wallet 0x7c…a4e1</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-hairline px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:bg-porcelain-deep"
        >
          Back to the arena
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Fish NFT card */}
        <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-porcelain p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Your fish</span>
            <TierBadge tier={tier} name={tierName} />
          </div>
          <div className="flex items-center justify-center rounded-lg border border-hairline bg-porcelain-deep/40 py-6">
            <PixelFish tier={tier} seed={1337} size={168} />
          </div>
          <div>
            <div className="font-display text-lg text-ink">
              {tierName} <span className="text-tide">#1337</span>
            </div>
            <div className="mt-0.5 font-mono text-xs text-tide">Claimed onchain · free to own</div>
          </div>
          {/* tier progress */}
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-tide">
              <span>{tierName}</span>
              <span>{nextMin ? `next: ${TIER_NAMES[tier]} at ${fmt(nextMin)}` : "max tier"}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
              <div className="h-full rounded-full bg-depth" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Attack" value={`Lv ${atkLvl}`} sub={`×${atkMult.toFixed(2)}`} />
            <MiniStat label="Defense" value={`Lv ${defLvl}`} sub={`×${defMult.toFixed(2)}`} />
          </div>
        </section>

        {/* Balances + actions */}
        <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-porcelain p-5 lg:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Balances - all $CHUM</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Balance label="Deposit" hint="in the fish · always safe" value={staked} tone="kelp" />
            <Balance label="Wallet" hint="safe · pays for upgrades" value={wallet} tone="kelp" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Action onClick={withdraw} disabled={staked <= WITHDRAW_RESET} tone="kelp">
              Withdraw {staked > WITHDRAW_RESET ? fmt(staked - WITHDRAW_RESET) : ""} to wallet
            </Action>
            <Action onClick={deposit} disabled={wallet < 50} tone="depth">
              Deposit 50 into fish
            </Action>
          </div>

          <div className="h-px w-full bg-hairline" />

          <span className="font-mono text-[11px] uppercase tracking-wide text-tide">
            Upgrades - spend $CHUM · 90% burned · 10% to the weekly pool
          </span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Upgrade
              label="Attack power"
              desc="Bite harder - punch above your size."
              lvl={atkLvl}
              cost={atkCost}
              canAfford={wallet >= atkCost}
              onClick={upAtk}
            />
            <Upgrade
              label="Defense power"
              desc="Bleed slower - survive bigger fish."
              lvl={defLvl}
              cost={defCost}
              canAfford={wallet >= defCost}
              onClick={upDef}
            />
          </div>
        </section>
      </div>

      {/* Economy + leaderboard */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-porcelain p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-tide">$CHUM economy</span>
          <StatRow label="Total burned" value={fmt(burned)} tone="coral" />
          <StatRow label="Weekly prize pool" value={fmt(pool)} tone="gold" />
          <StatRow label="Reserve" value="182,400" tone="kelp" />
          <StatRow label="You've taken home" value={fmt(taken)} tone="kelp" />
          <div className="mt-1 border-t border-hairline pt-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-tide">Prize pool funded by</div>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-tide">
              Cosmetics, tournament entries, and a reserve saved in busy weeks. Not by anyone&apos;s
              deposit. Upgrades also burn 90% and route 10% here.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-porcelain p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Weekly leaderboard</span>
            <span className="font-mono text-[11px] text-tide">resets in 3d 14h</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wide text-tide">
                  <th className="py-1 pr-2 font-normal">#</th>
                  <th className="py-1 pr-2 font-normal">Fish</th>
                  <th className="py-1 pr-2 text-right font-normal">Won this week</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD.map((r) => (
                  <tr
                    key={r.rank}
                    className={`border-t border-hairline ${r.you ? "bg-depth-tint/40" : ""}`}
                  >
                    <td className="py-2 pr-2 font-mono text-sm text-tide">{r.rank}</td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <PixelFish tier={r.tier} seed={r.id} size={26} />
                        <span className={`font-mono text-sm ${r.you ? "text-depth" : "text-ink"}`}>
                          {r.name} #{r.id}
                          {r.you ? " (you)" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right font-mono text-sm text-kelp">{fmt(r.won)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Season + daily reward */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-porcelain p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Season 3 · Deep Currents</span>
            <span className="font-mono text-[11px] text-tide">ends in 4d 9h</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Your rank" value="#4" sub="of 2,143" />
            <MiniStat label="Prize pool" value={`${fmt(pool)}`} sub="CHUM" />
            <MiniStat label="Top 100 paid" value="Yes" sub="you qualify" />
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-tide">
            Seasons reset the leaderboard and pay out the prize pool. Finish high to earn, then start the
            next season with your rank and badges intact.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-hairline bg-porcelain p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Daily reward</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl text-kelp">+250</span>
            <span className="font-mono text-xs text-tide">CHUM</span>
          </div>
          <div className="font-mono text-[11px] text-tide">{streak} day streak</div>
          <button
            type="button"
            onClick={claimDaily}
            disabled={dailyClaimed}
            className="mt-1 rounded-md bg-depth px-4 py-2 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain disabled:cursor-default disabled:bg-hairline disabled:text-tide"
          >
            {dailyClaimed ? "Claimed today" : "Claim"}
          </button>
        </section>
      </div>

      {/* Progression + pack */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-porcelain p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Progression</span>
            <span className="rounded-full border border-gold/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
              Rank: Reaver
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Meals" value="1,204" sub="all time" />
            <MiniStat label="Best combo" value="x9" sub="chain" />
            <MiniStat label="Survived" value="38" sub="takedowns" />
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-tide">Badges</div>
            <div className="flex flex-wrap gap-2">
              {["Whale Slayer", "Bounty Hunter", "7 Day Streak", "Frenzy Feeder"].map((b) => (
                <span key={b} className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] text-ink">
                  {b}
                </span>
              ))}
              <span className="rounded-full border border-dashed border-hairline px-2.5 py-1 font-mono text-[10px] text-tide/60">
                Season 3 champ · locked
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-porcelain p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Your pack</span>
            <span className="font-mono text-[11px] text-tide">Pack rank #6</span>
          </div>
          <div className="font-display text-base text-ink">Saltwater Syndicate</div>
          <div className="flex -space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-porcelain-deep/50">
                <PixelFish tier={((i * 2) % 6) + 1} seed={i * 5} size={18} />
              </span>
            ))}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-porcelain-deep/50 font-mono text-[10px] text-tide">
              +7
            </span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-tide">
            Packs hunt together, climb a shared leaderboard, and split a pack prize each season. Invite a
            friend and you both earn 500 CHUM when they claim their fish.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard.writeText("https://feedingfrenzy.gg/join/1337");
                }
              }}
              className="rounded-md border border-depth/50 px-3 py-1.5 font-mono text-[11px] text-depth outline-none transition-colors hover:bg-depth/10 focus-visible:ring-2 focus-visible:ring-depth"
            >
              Copy invite link
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function TierBadge({ tier, name }: { tier: number; name: string }) {
  const gold = tier >= 5;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        gold ? "border-gold/50 text-gold" : "border-hairline text-tide"
      }`}
    >
      Tier {tier} · {name}
    </span>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-hairline p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wide text-tide">{label}</div>
      <div className="mt-0.5 font-mono text-sm text-ink">
        {value} <span className="text-tide">{sub}</span>
      </div>
    </div>
  );
}

function Balance({ label, hint, value, tone }: { label: string; hint: string; value: number; tone: "coral" | "kelp" }) {
  const color = tone === "coral" ? "text-coral" : "text-kelp";
  return (
    <div className="rounded-lg border border-hairline p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-tide">{label}</span>
        <span className={`font-mono text-[10px] ${color}`}>{hint.split(" · ")[hint.split(" · ").length - 1]}</span>
      </div>
      <div className={`mt-1 font-mono text-2xl ${color}`}>{fmt(value)}</div>
      <div className="mt-0.5 font-mono text-[10px] text-tide">{hint}</div>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "kelp" | "depth";
}) {
  const base =
    tone === "kelp"
      ? "border-kelp/50 text-kelp hover:bg-kelp/10 focus-visible:ring-kelp"
      : "border-depth/50 text-depth hover:bg-depth/10 focus-visible:ring-depth";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 font-mono text-xs outline-none transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:border-hairline disabled:text-tide/50 ${base}`}
    >
      {children}
    </button>
  );
}

function Upgrade({
  label,
  desc,
  lvl,
  cost,
  canAfford,
  onClick,
}: {
  label: string;
  desc: string;
  lvl: number;
  cost: number;
  canAfford: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline p-3">
      <div>
        <div className="font-display text-sm text-ink">
          {label} <span className="font-mono text-xs text-tide">Lv {lvl}</span>
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-tide">{desc}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={!canAfford}
        className="shrink-0 rounded-md border border-depth/50 px-2.5 py-1.5 font-mono text-[11px] text-depth outline-none transition-colors hover:bg-depth/10 focus-visible:ring-2 focus-visible:ring-depth disabled:cursor-not-allowed disabled:border-hairline disabled:text-tide/50"
      >
        {fmt(cost)} CHUM
      </button>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone: "coral" | "gold" | "kelp" }) {
  const color = tone === "coral" ? "text-coral" : tone === "gold" ? "text-gold" : "text-kelp";
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-tide">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{value}</span>
    </div>
  );
}

