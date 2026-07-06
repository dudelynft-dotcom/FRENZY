import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Logo } from "@/components/brand/Logo";
import "./globals.css";

// Fonts are self-hosted (latin woff2 in ./fonts) - no external build dependency,
// no layout shift, faster first paint.
const display = localFont({
  src: "./fonts/SchibstedGrotesk.woff2",
  weight: "400 900",
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "./fonts/Inter.woff2",
  weight: "400 600",
  variable: "--font-body",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexMono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Feeding Frenzy",
    template: "%s · Feeding Frenzy",
  },
  description:
    "A live onchain ocean where every fish is real money. Stake $CHUM, hunt for winnings, surface to secure them. Your deposit is always safe.",
};

const NAV = [
  { href: "/play", label: "Play" },
  { href: "/buy", label: "Buy $CHUM" },
  { href: "/rules", label: "How to play" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col bg-porcelain">
        <AuthProvider>
        <header className="sticky top-0 z-40 border-b border-hairline bg-porcelain">
          <div className="mx-auto flex w-full max-w-shell items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" aria-label="Feeding Frenzy home">
              <Logo />
            </Link>
            <div className="flex items-center gap-1">
              <nav aria-label="Primary" className="hidden items-center gap-0.5 font-mono text-xs sm:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded px-3 py-1.5 text-tide transition-colors hover:bg-porcelain-deep hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="ml-1">
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="mt-8 border-t border-hairline">
          <div className="mx-auto grid w-full max-w-shell gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-3">
              <Logo />
              <p className="max-w-xs font-mono text-[11px] leading-relaxed text-tide">
                A live onchain ocean. Your deposit is always safe. Only winnings you have not secured are
                ever at stake.
              </p>
            </div>
            <FooterCol
              title="Play"
              links={[
                { href: "/play", label: "Enter the water" },
                { href: "/rules", label: "How to play" },
                { href: "/dashboard", label: "Dashboard" },
              ]}
            />
            <FooterCol
              title="Community"
              links={[
                { href: "/", label: "X (soon)" },
                { href: "/", label: "Discord (soon)" },
                { href: "/rules", label: "The rules" },
              ]}
            />
          </div>
          <div className="border-t border-hairline">
            <div className="mx-auto flex w-full max-w-shell flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
              <span className="font-mono text-[11px] text-tide">Feeding Frenzy. Prototype build.</span>
              <span className="font-mono text-[11px] text-tide">Powered by $CHUM</span>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-mono text-[11px] uppercase tracking-wide text-ink">{title}</div>
      {links.map((l, i) => (
        <Link
          key={`${l.href}-${i}`}
          href={l.href}
          className="w-fit font-mono text-[13px] text-tide transition-colors hover:text-ink"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
