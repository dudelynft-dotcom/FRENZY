import type { Metadata } from "next";
import Link from "next/link";
import { PixelFish } from "@/components/dashboard/PixelFish";

export const metadata: Metadata = {
  title: "Feeding Frenzy",
  description:
    "A live onchain ocean where every fish is real money. Claim your fish, buy $CHUM, hunt for winnings, and surface to secure them. Your deposit is always safe.",
};

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FoodChain />
      <Token />
      <Claim />
      <ClosingCta />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-[14vw] font-semibold leading-[0.92] tracking-tight text-ink sm:text-6xl lg:text-7xl">
          Eat, or be
          <br />
          <span className="text-depth">eaten.</span>
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-tide">
          Feeding Frenzy is a living ocean where every fish holds real money. Buy $CHUM, stake it in your
          fish, hunt smaller fish for winnings, and surface before something bigger takes a bite. Your
          deposit is always safe. Only your winnings are ever at stake.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/play"
            className="rounded-md bg-depth px-5 py-3 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
          >
            Enter the water
          </Link>
          <Link
            href="/buy"
            className="rounded-md border border-hairline px-5 py-3 font-mono text-sm text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
          >
            Buy $CHUM
          </Link>
        </div>
        <p className="font-mono text-xs text-tide">
          Join, claim your fish free with one click, and start feeding. No whitelist. No mint.
        </p>
      </div>

      <HeroOcean />
    </section>
  );
}

function HeroOcean() {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-hairline shadow-float sm:h-[480px]">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, #8FCDD0 0%, #2A6E90 46%, #071726 100%)" }}
      />
      <div className="absolute inset-x-0 top-0 h-[72px] bg-[rgba(231,240,241,0.26)]" />
      <div className="absolute inset-x-0 top-[72px] border-t border-dashed border-[rgba(30,107,79,0.85)]" />
      <span className="absolute left-4 top-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0E4DA4]">
        Surface, safe zone
      </span>
      <div className="absolute left-8 top-6">
        <PixelFish tier={1} seed={5} size={30} />
      </div>
      <div className="absolute right-10 top-[120px]">
        <PixelFish tier={2} seed={11} size={40} />
      </div>
      <div className="absolute left-[24%] top-[180px]">
        <PixelFish tier={3} seed={7} size={62} />
      </div>
      <div className="absolute right-[16%] top-[250px]">
        <PixelFish tier={4} seed={2} size={84} />
      </div>
      <div className="absolute left-[10%] bottom-8">
        <PixelFish tier={6} seed={9} size={128} />
      </div>
      <span className="absolute bottom-3 right-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(200,185,137,0.95)]">
        The deep
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const STATS: [string, string][] = [
  ["Fish in the water now", "2,143"],
  ["$CHUM burned to date", "1,284,900"],
  ["Deepest fish", "Leviathan #0007"],
  ["Biggest weekly haul", "41,250 CHUM"],
];

function StatsBar() {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline lg:grid-cols-4">
      {STATS.map(([label, value]) => (
        <div key={label} className="bg-porcelain px-5 py-6">
          <div className="font-mono text-[11px] uppercase tracking-wide text-tide">{label}</div>
          <div className="mt-2 font-mono text-xl text-ink">{value}</div>
        </div>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps: [React.ReactNode, string, string][] = [
    [<IconDeposit key="d" />, "Stake $CHUM in your fish", "The more you stake, the bigger your fish and the higher its tier. Your deposit is protected and never lost."],
    [<IconHunt key="h" />, "Dive and hunt", "Below the surface, bite $CHUM off other fish. You are faster than anything bigger, so raid and run."],
    [<IconSurface key="s" />, "Surface and secure", "Rise to the safe zone and secure your winnings into your deposit. Then dive again, bigger."],
  ];
  return (
    <section className="border-t border-hairline py-16">
      <h2 className="max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Three moves, one food chain.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(([icon, title, copy], i) => (
          <div key={title} className="flex flex-col gap-4 rounded-xl border border-hairline bg-porcelain p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline text-depth">
                {icon}
              </div>
              <span className="font-mono text-xs text-tide">0{i + 1}</span>
            </div>
            <div className="font-display text-lg text-ink">{title}</div>
            <p className="text-[15px] leading-relaxed text-tide">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const LADDER: [number, string, string][] = [
  [1, "Spawn", "0 to 49"],
  [2, "Snapper", "50 to 249"],
  [3, "Barracuda", "250 to 999"],
  [4, "Shark", "1,000 to 4,999"],
  [5, "Orca", "5,000 to 24,999"],
  [6, "Leviathan", "25,000+"],
];

function FoodChain() {
  return (
    <section className="border-t border-hairline py-16">
      <h2 className="max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Six tiers, from Spawn to Leviathan.
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-tide">
        Your fish evolves live as its stake grows. Feed it enough $CHUM and a Spawn becomes a Leviathan.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LADDER.map(([tier, name, range]) => (
          <div key={name} className="flex items-center gap-4 rounded-xl border border-hairline bg-porcelain p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-porcelain-deep/40">
              <PixelFish tier={tier} seed={tier * 9} size={tier <= 2 ? 34 : 58} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-display text-base ${tier >= 5 ? "text-gold" : "text-ink"}`}>{name}</span>
                <span className="font-mono text-[11px] text-tide">T{tier}</span>
              </div>
              <div className="mt-1 font-mono text-xs text-tide">{range} CHUM</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Token() {
  return (
    <section className="border-t border-hairline py-16">
      <div className="grid gap-8 rounded-2xl border border-hairline bg-porcelain p-8 lg:grid-cols-2 lg:p-12">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">$CHUM has a mouth.</h2>
          <p className="text-[15px] leading-relaxed text-tide">
            $CHUM is the blood in the water. Buy it on a simple bonding curve with no trading fees, stake
            it in your fish, win it from others, and burn it to grow stronger. Buy only until 60% is sold
            out, then selling opens. The prize pool is funded by cosmetics, tournaments, and a reserve, so
            rewards never come from anyone&apos;s deposit.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/buy"
              className="rounded-md bg-depth px-4 py-2.5 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
            >
              Buy $CHUM
            </Link>
            <Link
              href="/play"
              className="rounded-md border border-hairline px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
            >
              Play now
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <TokenRow label="Total supply" value="10,000,000,000" />
          <TokenRow label="Starting FDV" value="$100,000" />
          <TokenRow label="Curve" value="+0.05% per $1,000 bought" />
          <TokenRow label="Trading fees" value="None" />
          <TokenRow label="Selling unlocks at" value="60% sold out" />
          <TokenRow label="Every upgrade burned" value="90%" tone="coral" />
        </div>
      </div>
    </section>
  );
}

function TokenRow({ label, value, tone }: { label: string; value: string; tone?: "coral" | "gold" }) {
  const color = tone === "coral" ? "text-coral" : tone === "gold" ? "text-gold" : "text-ink";
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-3">
      <span className="font-mono text-sm text-tide">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Claim() {
  return (
    <section className="border-t border-hairline py-16">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <h2 className="max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Your fish is free. Just claim it.
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed text-tide">
            No whitelist, no mint, no race. When you join, a fish is yours. Claim it onchain with a single
            click and a small claim fee, buy some $CHUM, and dive in. That is the whole onboarding.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/play"
              className="rounded-md bg-depth px-4 py-2.5 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
            >
              Claim your fish
            </Link>
            <Link
              href="/buy"
              className="rounded-md border border-hairline px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
            >
              Buy $CHUM
            </Link>
          </div>
        </div>
        <div className="hidden items-center justify-center rounded-2xl border border-hairline bg-porcelain-deep/30 p-10 lg:flex">
          <PixelFish tier={1} seed={21} size={150} />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ClosingCta() {
  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-hairline bg-ink">
      <div className="relative px-8 py-16 text-center sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "linear-gradient(to bottom, rgba(143,205,208,0.10), rgba(7,23,38,0))" }}
        />
        <div className="relative flex flex-col items-center gap-5">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-porcelain sm:text-5xl">
            The water is open.
          </h2>
          <p className="max-w-md font-mono text-sm text-porcelain/70">
            Deposit is safe. Winnings are earned. The only question is how deep you are willing to go.
          </p>
          <Link
            href="/play"
            className="rounded-md bg-porcelain px-6 py-3 font-mono text-sm text-ink outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-porcelain focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Enter the water
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---- custom line icons ---- */

function IconDeposit() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M11 3v9" />
      <path d="M7.5 8.5 11 12l3.5-3.5" />
      <path d="M4 14v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function IconHunt() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <circle cx="11" cy="11" r="2.5" />
      <path d="M11 1v3M11 18v3M1 11h3M18 11h3" />
    </svg>
  );
}

function IconSurface() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 6h16" strokeDasharray="2 2" />
      <path d="M11 19v-9" />
      <path d="M7.5 13.5 11 10l3.5 3.5" />
    </svg>
  );
}
