"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/* Bonding curve
 * supply       = 10,000,000,000 CHUM
 * start FDV    = $100,000  ->  start price = 100000 / 10e9 = $0.00001
 * every $1,000 of buys raises the price by 0.05%  ->  price = start * 1.0005 ^ (raised / 1000)
 * Buy only. Selling back to the curve unlocks once 60% of supply is sold.
 */
const SUPPLY = 10_000_000_000;
const START_FDV = 100_000;
const START_PRICE = START_FDV / SUPPLY; // 0.00001
const STEP = 1.0005; // per $1,000
const SELL_UNLOCK_PCT = 60;
const priceAt = (raised: number) => START_PRICE * Math.pow(STEP, raised / 1000);
const fdvAt = (raised: number) => priceAt(raised) * SUPPLY;

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const price = (p: number) => "$" + p.toFixed(8);
const chum = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => n.toFixed(1) + "%";

const PRESETS = [100, 500, 1000, 5000];

export default function BuyPage() {
  // Mock market state.
  const [raised, setRaised] = useState(268_400);
  const [sold, setSold] = useState(2_400_000_000); // ~24% of supply sold
  const [amount, setAmount] = useState(500);
  const [flash, setFlash] = useState<string | null>(null);

  const p0 = priceAt(raised);
  const fdv = fdvAt(raised);
  const soldPct = (sold / SUPPLY) * 100;
  const sellUnlocked = soldPct >= SELL_UNLOCK_PCT;

  const { tokens, avgPrice, nextPrice, impact } = useMemo(() => {
    const a = Math.max(0, amount);
    const p1 = priceAt(raised + a);
    const k = Math.log(STEP) / 1000;
    const tok = a <= 0 ? 0 : (Math.exp(-k * raised) - Math.exp(-k * (raised + a))) / (k * START_PRICE);
    return {
      tokens: tok,
      avgPrice: tok > 0 ? a / tok : p0,
      nextPrice: p1,
      impact: p0 > 0 ? (p1 / p0 - 1) * 100 : 0,
    };
  }, [amount, raised, p0]);

  const buy = () => {
    if (amount <= 0) return;
    setRaised((r) => r + amount);
    setSold((s) => Math.min(SUPPLY, s + tokens));
    setFlash(`Bought ${chum(tokens)} CHUM for ${usd(amount)}.`);
    window.setTimeout(() => setFlash(null), 4000);
  };

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-hairline py-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Buy $CHUM</h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-tide">
          $CHUM is sold on a bonding curve. Every buy pushes the price up a little, so the earlier you
          are, the cheaper it is. There are no trading fees. Buy what you need to stake, play, or trade.
        </p>
      </header>

      {/* Sellout gate */}
      <section className="rounded-xl border border-hairline bg-porcelain p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-tide">Sellout</span>
          <span className="font-mono text-xs text-ink">
            {pct(soldPct)} of supply sold {sellUnlocked ? "· selling is open" : `· selling unlocks at ${SELL_UNLOCK_PCT}%`}
          </span>
        </div>
        <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-depth" style={{ width: `${Math.min(100, soldPct)}%` }} />
          <div
            className="absolute top-0 h-full w-px bg-gold"
            style={{ left: `${SELL_UNLOCK_PCT}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-tide">
          <span>0%</span>
          <span className="text-gold">{SELL_UNLOCK_PCT}% sell unlock</span>
          <span>100%</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Buy / Sell panel */}
        <section className="flex flex-col gap-4 rounded-2xl border border-hairline bg-porcelain p-6">
          <div className="flex gap-1 rounded-lg border border-hairline p-1">
            <span className="flex-1 rounded-md bg-depth px-3 py-1.5 text-center font-mono text-xs text-porcelain">
              Buy
            </span>
            <span
              className="flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-center font-mono text-xs text-tide/60"
              title={`Selling unlocks once ${SELL_UNLOCK_PCT}% of supply is sold`}
            >
              Sell {sellUnlocked ? "" : "(locked)"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay" className="font-mono text-[11px] uppercase tracking-wide text-tide">
              You pay (USD)
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-3 focus-within:ring-2 focus-within:ring-depth">
              <span className="font-mono text-lg text-tide">$</span>
              <input
                id="pay"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent font-mono text-lg text-ink outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                    amount === v ? "border-depth text-depth" : "border-hairline text-tide hover:text-ink"
                  }`}
                >
                  ${v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center text-tide" aria-hidden>
            <svg width="16" height="20" viewBox="0 0 16 20">
              <line x1="8" y1="0" x2="8" y2="13" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 12 L8 20 L13 12 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-tide">You receive</span>
            <div className="rounded-lg border border-hairline bg-porcelain-deep/30 px-3 py-3">
              <div className="font-mono text-2xl text-ink">{chum(tokens)}</div>
              <div className="mt-0.5 font-mono text-[11px] text-tide">CHUM</div>
            </div>
          </div>

          <dl className="flex flex-col gap-2 pt-1">
            <Row term="Average price" val={price(avgPrice)} />
            <Row term="Price after buy" val={price(nextPrice)} />
            <Row term="Curve move" val={`+${impact.toFixed(2)}%`} />
          </dl>

          <button
            type="button"
            onClick={buy}
            className="mt-1 rounded-md bg-depth px-4 py-3 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
          >
            Buy $CHUM
          </button>
          {flash ? (
            <p className="font-mono text-[12px] text-kelp">{flash}</p>
          ) : (
            <p className="font-mono text-[11px] text-tide">Prototype. Connect a wallet at launch to buy onchain.</p>
          )}
        </section>

        {/* Market panel */}
        <section className="flex flex-col gap-5 rounded-2xl border border-hairline bg-porcelain p-6">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Price" value={price(p0)} />
            <Stat label="Fully diluted value" value={usd(fdv)} />
            <Stat label="Raised on the curve" value={usd(raised)} />
            <Stat label="Total supply" value="10,000,000,000" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-tide">
              <span>Price curve</span>
              <span>FDV rises with every buy</span>
            </div>
            <CurveChart raised={raised} />
          </div>

          <p className="font-mono text-[11px] leading-relaxed text-tide">
            The curve is deliberate and slow: FDV starts at {usd(START_FDV)} and rises 0.05% for every
            $1,000 that flows through it. Buy only for now. Selling back to the curve opens once{" "}
            {SELL_UNLOCK_PCT}% of supply is sold.
          </p>
        </section>
      </div>

      {/* Where rewards come from */}
      <section className="rounded-2xl border border-hairline bg-porcelain p-6">
        <h2 className="font-display text-xl tracking-tight text-ink">Rewards are not funded by your deposit</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-tide">
          Your deposit is always yours. The weekly prize pool is funded by real revenue that nobody has to
          lose for you to earn: cosmetics, tournament entries, and a reserve saved during busy weeks.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SourceCard title="Cosmetics" desc="Skins and flair sold in the shop. Pure revenue, no one loses." />
          <SourceCard title="Tournaments" desc="Paid seasons and events with their own prize pools." />
          <SourceCard title="Reserve" desc="Saved in busy weeks, paid out to keep slow weeks healthy." />
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-hairline pt-8">
        <Link
          href="/play"
          className="rounded-md bg-depth px-4 py-2.5 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
        >
          Take your CHUM into the water
        </Link>
        <Link
          href="/shop"
          className="rounded-md border border-hairline px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
}

function Row({ term, val }: { term: string; val: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-mono text-xs text-tide">{term}</dt>
      <dd className="font-mono text-xs text-ink">{val}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline p-3">
      <div className="font-mono text-[10px] uppercase tracking-wide text-tide">{label}</div>
      <div className="mt-1 font-mono text-sm text-ink">{value}</div>
    </div>
  );
}

function SourceCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-hairline p-3">
      <div className="font-display text-sm text-ink">{title}</div>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-tide">{desc}</p>
    </div>
  );
}

function CurveChart({ raised }: { raised: number }) {
  const W = 100;
  const H = 46;
  const maxRaised = Math.max(raised * 1.8, 1_500_000);
  const minFdv = fdvAt(0);
  const maxFdv = fdvAt(maxRaised);
  const x = (r: number) => (r / maxRaised) * W;
  const y = (f: number) => H - ((f - minFdv) / (maxFdv - minFdv)) * H;

  const pts: string[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * maxRaised;
    pts.push(`${x(r).toFixed(2)},${y(fdvAt(r)).toFixed(2)}`);
  }
  const cx = x(raised);
  const cy = y(fdvAt(raised));

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-porcelain-deep/20">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
        <polyline points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill="rgba(14,77,164,0.06)" stroke="none" />
        <polyline points={pts.join(" ")} fill="none" stroke="#0E4DA4" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        <line x1={cx} y1="0" x2={cx} y2={H} stroke="#1E6B4F" strokeWidth="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <circle cx={cx} cy={cy} r="1.4" fill="#1E6B4F" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
