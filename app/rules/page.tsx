import type { Metadata } from "next";
import Link from "next/link";
import { PixelFish } from "@/components/dashboard/PixelFish";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "The complete player guide for Feeding Frenzy. Stake, hunt, secure, and cash out. Your deposit is always safe.",
};

const TOC = [
  ["ocean", "The ocean"],
  ["fish", "Your fish"],
  ["money", "The money"],
  ["loop", "The loop"],
  ["combat", "Combat"],
  ["upgrades", "Upgrades"],
  ["safety", "Staying safe"],
];

export default function RulesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-hairline py-12">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-tide">Player guide</span>
        <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          How to play Feeding Frenzy
        </h1>
        <p className="max-w-2xl text-[17px] leading-relaxed text-tide">
          You are a fish. Eat smaller fish and bite bigger ones to win $CHUM. Your deposit is always safe.
          The only thing you can ever lose is winnings you have not secured yet. Here is everything, with
          diagrams.
        </p>
        <div>
          <Link
            href="/play"
            className="inline-flex rounded-md bg-depth px-5 py-3 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
          >
            Enter the water
          </Link>
        </div>
      </header>

      <div className="grid gap-12 py-12 lg:grid-cols-[200px_1fr]">
        {/* Sticky contents */}
        <aside className="hidden lg:block">
          <nav aria-label="Contents" className="sticky top-24 flex flex-col gap-1">
            <span className="mb-2 font-mono text-[11px] uppercase tracking-wide text-tide">Contents</span>
            {TOC.map(([id, label], i) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded px-2 py-1.5 font-mono text-[13px] text-tide transition-colors hover:bg-porcelain-deep hover:text-ink"
              >
                <span className="text-depth">{i + 1}.</span> {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex max-w-3xl flex-col gap-16">
          <Section id="ocean" n="1" title="The ocean at a glance">
            <P>The whole game happens in one column of water. Where you are decides whether you are safe.</P>
            <OceanDiagram />
            <Note>
              The surface is a safe zone. The deeper you go, the bigger the fish and the bigger the
              winnings, but everything you carry is at risk down there.
            </Note>
          </Section>

          <Section id="fish" n="2" title="Your fish grows through six tiers">
            <P>
              Every fish holds <B>$CHUM</B> inside it. The more it holds, the bigger it is and the higher
              its tier. You grow by winning CHUM from other fish. One NFT, an identity that climbs the
              whole chain.
            </P>
            <TierLadder />
          </Section>

          <Section id="money" n="3" title="Two kinds of money">
            <P>This is the most important part. Read it twice.</P>
            <MoneyFlow />
            <div className="grid gap-2 sm:grid-cols-3">
              <PoolCard tone="kelp" name="Deposit" tag="always safe">
                Your stake inside the fish. Never lost, not even in the sea. Sets your size and tier.
              </PoolCard>
              <PoolCard tone="coral" name="Winnings" tag="at risk in the sea">
                CHUM you grab on a dive. Can be bitten away below the surface. Safe the moment you surface.
              </PoolCard>
              <PoolCard tone="depth" name="Wallet" tag="safe, outside">
                Safe CHUM outside the fish. Pays for upgrades. Where you cash out from the Dashboard.
              </PoolCard>
            </div>
          </Section>

          <Section id="loop" n="4" title="The four step loop">
            <LoopDiagram />
          </Section>

          <Section id="combat" n="5" title="How a fight works">
            <P>
              When two fish touch, <B>both</B> bite $CHUM off each other and both lose <B>HP</B>. The
              stronger fish wins the exchange: it drains health faster and steals more. Break away and your
              HP refills.
            </P>
            <CombatDiagram />
            <Bullets
              items={[
                "Reach zero HP and a stronger fish takes your un-secured winnings and knocks you back. It never takes your deposit.",
                "A small fish can beat a big fish. You are faster than anything bigger. Dart in, bite, and dart back out before your health runs down. Several small fish together can take a whale down.",
              ]}
            />
          </Section>

          <Section id="upgrades" n="6" title="Power, and upgrades">
            <P>
              A fish&apos;s combat power is <B>size times attack</B>. A bigger fish hits harder, but you can
              upgrade <B>Attack</B> to punch above your size. Two upgrades, both bought with $CHUM.
            </P>
            <div className="grid gap-2 sm:grid-cols-2">
              <PoolCard tone="depth" name="Attack" tag="hit harder">
                Take bigger bites and out power fish above your size.
              </PoolCard>
              <PoolCard tone="depth" name="Defense" tag="last longer">
                Bleed slower. Survive contact with bigger fish for longer.
              </PoolCard>
            </div>
            <div className="rounded-xl border border-hairline bg-porcelain p-5">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-tide">
                Where your upgrade CHUM goes
              </div>
              <BurnBar />
            </div>
          </Section>

          <Section id="safety" n="7" title="Staying safe, securing, and cashing out">
            <Bullets
              items={[
                "The surface is a safe zone. No fighting happens there. Park at the top as long as you like to watch the water and pick your moment. You lose nothing while you wait.",
                "Secure (a button in the arena, at the surface) moves this dive's winnings into your safe deposit. After that they can never be lost.",
                "Withdraw (on the Dashboard) moves CHUM from your deposit out to your wallet, to cash out.",
              ]}
            />
          </Section>

          {/* Golden rule */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-ink p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-porcelain/60">The golden rule</div>
            <p className="mt-3 max-w-2xl font-display text-2xl leading-snug text-porcelain">
              Your deposit is always safe. The only thing you can lose is winnings you have not secured
              yet. So do not get greedy. Surface and secure before a Leviathan catches you.
            </p>
            <div className="mt-6">
              <Link
                href="/play"
                className="inline-flex rounded-md bg-porcelain px-5 py-3 font-mono text-sm text-ink outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-porcelain focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Dive in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Diagrams                                                                   */
/* -------------------------------------------------------------------------- */

function OceanDiagram() {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-hairline">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, #8FCDD0 0%, #2A6E90 46%, #071726 100%)" }}
      />
      <div className="absolute inset-x-0 top-0 h-[80px] bg-[rgba(231,240,241,0.26)]" />
      <div className="absolute inset-x-0 top-[80px] border-t border-dashed border-[rgba(30,107,79,0.9)]" />
      <div className="absolute left-4 top-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0E4DA4]">
        Surface, safe zone
      </div>
      <div className="absolute left-4 top-[26px] max-w-[240px] font-mono text-[11px] leading-snug text-[#10222E]">
        No fighting here. Secure your winnings. Wait and watch as long as you like.
      </div>

      <div className="absolute left-6 top-[38px]">
        <PixelFish tier={1} seed={3} size={32} />
      </div>
      <div className="absolute left-[52%] top-[140px]">
        <PixelFish tier={3} seed={7} size={58} />
      </div>
      <div className="absolute left-[22%] top-[220px]">
        <PixelFish tier={4} seed={2} size={78} />
      </div>
      <div className="absolute right-6 bottom-6">
        <PixelFish tier={6} seed={9} size={116} />
      </div>

      <div className="absolute bottom-3 left-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(200,185,137,0.95)]">
        The deep, bigger fish, bigger winnings, at risk
      </div>

      <div className="absolute right-4 top-[96px] flex flex-col items-center text-[rgba(255,255,255,0.85)]">
        <Arrow dir="down" />
        <span className="mt-1 font-mono text-[10px]">dive</span>
      </div>
      <div className="absolute right-4 bottom-[96px] flex flex-col items-center text-[rgba(255,255,255,0.85)]">
        <span className="mb-1 font-mono text-[10px]">surface</span>
        <Arrow dir="up" />
      </div>
    </div>
  );
}

const LADDER: [number, string, string][] = [
  [1, "Spawn", "0 to 49"],
  [2, "Snapper", "50 to 249"],
  [3, "Barracuda", "250 to 999"],
  [4, "Shark", "1,000 to 4,999"],
  [5, "Orca", "5,000 to 24,999"],
  [6, "Leviathan", "25,000+"],
];

function TierLadder() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {LADDER.map(([tier, name, range]) => (
        <div key={name} className="flex items-center gap-3 rounded-xl border border-hairline bg-porcelain p-3">
          <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-porcelain-deep/40">
            <PixelFish tier={tier} seed={tier * 7} size={tier <= 2 ? 30 : 54} />
          </div>
          <div>
            <div className={`font-display text-sm ${tier >= 5 ? "text-gold" : "text-ink"}`}>
              {name} <span className="font-mono text-[11px] text-tide">Tier {tier}</span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-tide">{range} CHUM</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MoneyFlow() {
  return (
    <div className="flex flex-col items-stretch gap-2 rounded-xl border border-hairline bg-porcelain p-4 sm:flex-row sm:items-center">
      <FlowBox tone="coral" title="Winnings" sub="at risk in the sea" />
      <FlowArrow label="Secure at the surface" />
      <FlowBox tone="kelp" title="Deposit" sub="always safe" />
      <FlowArrow label="Withdraw on dashboard" />
      <FlowBox tone="depth" title="Wallet" sub="cash out" />
    </div>
  );
}

function FlowBox({ tone, title, sub }: { tone: "coral" | "kelp" | "depth"; title: string; sub: string }) {
  const color = tone === "coral" ? "text-coral border-coral/40" : tone === "kelp" ? "text-kelp border-kelp/40" : "text-depth border-depth/40";
  return (
    <div className={`flex-1 rounded-lg border ${color} bg-porcelain px-3 py-2.5 text-center`}>
      <div className={`font-display text-sm ${color.split(" ")[0]}`}>{title}</div>
      <div className="mt-0.5 font-mono text-[10px] text-tide">{sub}</div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center px-1">
      <svg width="46" height="12" viewBox="0 0 46 12" className="hidden text-tide sm:block" aria-hidden>
        <line x1="0" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M40 2 L46 6 L40 10 Z" fill="currentColor" />
      </svg>
      <svg width="12" height="20" viewBox="0 0 12 20" className="text-tide sm:hidden" aria-hidden>
        <line x1="6" y1="0" x2="6" y2="14" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 14 L6 20 L10 14 Z" fill="currentColor" />
      </svg>
      <span className="mt-1 max-w-[92px] text-center font-mono text-[9px] leading-tight text-tide">{label}</span>
    </div>
  );
}

function LoopDiagram() {
  const steps: [string, string, string][] = [
    ["1", "Start safe", "You spawn at the surface. Watch the water first."],
    ["2", "Dive and bite", "Swim down and touch fish to bite CHUM off them."],
    ["3", "Surface and secure", "Swim up and press Secure to lock winnings into your deposit."],
    ["4", "Repeat", "Dive again, bigger and safer. Climb the food chain."],
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map(([n, title, bodyText]) => (
        <div key={n} className="rounded-xl border border-hairline bg-porcelain p-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-depth/40 font-mono text-xs text-depth">
            {n}
          </div>
          <div className="mt-2.5 font-display text-sm text-ink">{title}</div>
          <div className="mt-1 font-mono text-[11px] leading-snug text-tide">{bodyText}</div>
        </div>
      ))}
    </div>
  );
}

function CombatDiagram() {
  return (
    <div className="relative h-[160px] w-full overflow-hidden rounded-xl border border-hairline bg-ink">
      <div className="absolute right-10 top-1/2 -translate-y-1/2">
        <PixelFish tier={5} seed={4} size={96} />
      </div>
      <div className="absolute left-12 top-1/2 -translate-y-1/2">
        <PixelFish tier={1} seed={2} size={34} />
      </div>
      <svg className="absolute inset-0 h-full w-full text-kelp" aria-hidden>
        <path d="M130 80 C 220 44, 320 44, 380 74" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" />
        <path d="M376 66 L386 75 L373 78 Z" fill="currentColor" />
        <path d="M380 86 C 320 114, 220 114, 138 88" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5 4" />
        <path d="M142 96 L130 88 L144 84 Z" fill="rgba(255,255,255,0.6)" />
      </svg>
      <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[11px] text-kelp">dart in, bite</span>
      <span className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[11px] text-white/60">
        dart out before your HP runs down
      </span>
    </div>
  );
}

function BurnBar() {
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-md border border-hairline font-mono text-[10px]">
        <div className="flex items-center justify-center bg-coral/15 text-coral" style={{ width: "90%" }}>
          90% burned forever
        </div>
        <div className="flex items-center justify-center bg-gold/20 text-gold" style={{ width: "10%" }}>
          10%
        </div>
      </div>
      <div className="mt-2 font-mono text-[11px] text-tide">
        Ninety percent of every upgrade is burned forever. Ten percent goes to the weekly leaderboard pool,
        paid to the top fish each week.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-depth font-mono text-[12px] text-porcelain">
          {n}
        </span>
        <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-tide">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-porcelain-deep/30 px-4 py-3 font-mono text-[13px] leading-relaxed text-tide">
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-tide">
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-depth" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function PoolCard({
  tone,
  name,
  tag,
  children,
}: {
  tone: "kelp" | "coral" | "depth";
  name: string;
  tag: string;
  children: React.ReactNode;
}) {
  const color = tone === "kelp" ? "text-kelp" : tone === "coral" ? "text-coral" : "text-depth";
  return (
    <div className="rounded-xl border border-hairline bg-porcelain p-4">
      <div className="flex items-center justify-between">
        <span className={`font-display text-sm ${color}`}>{name}</span>
        <span className={`font-mono text-[10px] uppercase tracking-wide ${color}`}>{tag}</span>
      </div>
      <p className="mt-1.5 text-sm text-tide">{children}</p>
    </div>
  );
}

function Arrow({ dir }: { dir: "up" | "down" }) {
  return dir === "down" ? (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden>
      <line x1="7" y1="0" x2="7" y2="15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 14 L7 22 L12 14 Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden>
      <line x1="7" y1="7" x2="7" y2="22" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 8 L7 0 L12 8 Z" fill="currentColor" />
    </svg>
  );
}
