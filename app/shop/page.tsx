"use client";

import { useState } from "react";
import { PixelFish } from "@/components/dashboard/PixelFish";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

type Skin = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number; // CHUM
  tier: number; // preview art
  seed: number;
};

const SKINS: Skin[] = [
  { id: "slate", name: "Abyss Slate", rarity: "Common", price: 1500, tier: 2, seed: 1 },
  { id: "kelp", name: "Kelp Warden", rarity: "Common", price: 1500, tier: 3, seed: 2 },
  { id: "sand", name: "Dune Runner", rarity: "Rare", price: 4000, tier: 3, seed: 3 },
  { id: "reaver", name: "Coral Reaver", rarity: "Rare", price: 4000, tier: 4, seed: 6 },
  { id: "orca", name: "Void Orca", rarity: "Epic", price: 12000, tier: 5, seed: 4 },
  { id: "baron", name: "Golden Baron", rarity: "Epic", price: 12000, tier: 5, seed: 9 },
  { id: "leviathan", name: "Deep Sovereign", rarity: "Legendary", price: 40000, tier: 6, seed: 7 },
  { id: "apex", name: "Apex Predator", rarity: "Legendary", price: 40000, tier: 6, seed: 12 },
];

const RARITY_COLOR: Record<Rarity, string> = {
  Common: "text-tide",
  Rare: "text-depth",
  Epic: "text-kelp",
  Legendary: "text-gold",
};
const RARITY_BORDER: Record<Rarity, string> = {
  Common: "border-hairline",
  Rare: "border-depth/40",
  Epic: "border-kelp/40",
  Legendary: "border-gold/50",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default function ShopPage() {
  const [wallet, setWallet] = useState(58_000);
  const [owned, setOwned] = useState<Set<string>>(new Set(["slate"]));
  const [equipped, setEquipped] = useState("slate");
  const [flash, setFlash] = useState<string | null>(null);

  const buy = (s: Skin) => {
    if (owned.has(s.id) || wallet < s.price) return;
    setWallet((w) => w - s.price);
    setOwned((o) => new Set(o).add(s.id));
    setEquipped(s.id);
    setFlash(`Bought ${s.name}. Your CHUM helped fill this week's prize pool.`);
    window.setTimeout(() => setFlash(null), 4000);
  };

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-hairline py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Shop</h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-tide">
              Skins and flair for your fish. Every purchase is pure revenue: part fills the weekly prize
              pool, part goes to the treasury. Nobody has to lose for you to earn.
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-porcelain px-4 py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wide text-tide">Your wallet</div>
            <div className="mt-1 font-mono text-lg text-depth">{fmt(wallet)} CHUM</div>
          </div>
        </div>
        {flash ? <p className="font-mono text-[12px] text-kelp">{flash}</p> : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKINS.map((s) => {
          const isOwned = owned.has(s.id);
          const isEquipped = equipped === s.id;
          const canAfford = wallet >= s.price;
          return (
            <div key={s.id} className={`flex flex-col gap-3 rounded-xl border bg-porcelain p-4 ${RARITY_BORDER[s.rarity]}`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[10px] uppercase tracking-wide ${RARITY_COLOR[s.rarity]}`}>
                  {s.rarity}
                </span>
                {isOwned ? <span className="font-mono text-[10px] text-tide">Owned</span> : null}
              </div>
              <div className="flex h-28 items-center justify-center rounded-lg bg-porcelain-deep/40">
                <PixelFish tier={s.tier} seed={s.seed} size={s.tier <= 2 ? 44 : 82} />
              </div>
              <div>
                <div className="font-display text-sm text-ink">{s.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-tide">{fmt(s.price)} CHUM</div>
              </div>
              {isOwned ? (
                <button
                  type="button"
                  onClick={() => setEquipped(s.id)}
                  disabled={isEquipped}
                  className="rounded-md border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth disabled:cursor-default disabled:text-kelp"
                >
                  {isEquipped ? "Equipped" : "Equip"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => buy(s)}
                  disabled={!canAfford}
                  className="rounded-md bg-depth px-3 py-1.5 font-mono text-[11px] text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain disabled:cursor-not-allowed disabled:bg-hairline disabled:text-tide"
                >
                  {canAfford ? "Buy" : "Not enough CHUM"}
                </button>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-hairline bg-porcelain p-6">
        <h2 className="font-display text-xl tracking-tight text-ink">Where the money goes</h2>
        <div className="mt-4 h-8 w-full overflow-hidden rounded-md border border-hairline font-mono text-[10px]">
          <div className="flex h-full">
            <div className="flex items-center justify-center bg-kelp/15 text-kelp" style={{ width: "60%" }}>
              60% to the weekly prize pool
            </div>
            <div className="flex items-center justify-center bg-depth/15 text-depth" style={{ width: "40%" }}>
              40% treasury
            </div>
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-tide">
          Cosmetics are how the game pays its players without draining anyone. The more people flex, the
          bigger the prize pool for everyone competing that week.
        </p>
      </section>
    </div>
  );
}
