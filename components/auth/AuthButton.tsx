"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { shortAddress, useAuth, type AuthMethod } from "./AuthProvider";

export function AuthButton() {
  const { user, ready, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // Before hydration settles, render the logged-out button so server and client match.
  if (!ready || !user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-depth px-3.5 py-1.5 font-mono text-xs text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
        >
          Log in
        </button>
        {modalOpen ? <LoginModal onClose={() => setModalOpen(false)} /> : null}
      </>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-md border border-hairline px-3 py-1.5 font-mono text-xs text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-kelp" aria-hidden />
        {shortAddress(user.address)}
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-tide" aria-hidden>
          <path d="M2 3.5 L5 6.5 L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-hairline bg-porcelain p-3 shadow-float"
        >
          <div className="font-mono text-[10px] uppercase tracking-wide text-tide">
            Signed in with {user.method === "x" ? "X" : "email"}
          </div>
          <div className="mt-0.5 truncate font-mono text-xs text-ink">{user.handle}</div>

          <div className="mt-3 font-mono text-[10px] uppercase tracking-wide text-tide">Your wallet</div>
          <div className="mt-1 flex items-center gap-2 rounded-md border border-hairline bg-porcelain-deep/30 px-2.5 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink">{user.address}</span>
            <button
              type="button"
              onClick={() => copy(user.address)}
              className="shrink-0 rounded border border-hairline px-2 py-1 font-mono text-[10px] text-tide transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-depth"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-1.5 font-mono text-xs text-tide transition-colors hover:bg-porcelain-deep hover:text-ink"
              role="menuitem"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="rounded px-2 py-1.5 text-left font-mono text-xs text-coral transition-colors hover:bg-coral/10"
              role="menuitem"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [mode, setMode] = useState<"choose" | AuthMethod>("choose");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finishX = () => {
    login("x", "@" + (["deepwater", "chumlord", "apexfin", "saltwater"][Math.floor(Math.random() * 4)]));
    onClose();
  };
  const finishEmail = () => {
    const handle = email.trim() || "player@feedingfrenzy.gg";
    login("email", handle);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-porcelain p-6 shadow-float">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg text-ink">Log in to Feeding Frenzy</h2>
            <p className="mt-1 font-mono text-[11px] text-tide">A wallet is created for you automatically.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-tide outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-depth"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        {mode === "choose" ? (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={finishX}
              className="flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-depth"
            >
              <XMark />
              Continue with X
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className="flex items-center justify-center gap-2 rounded-md border border-hairline px-4 py-3 font-mono text-sm text-ink outline-none transition-colors hover:bg-porcelain-deep focus-visible:ring-2 focus-visible:ring-depth"
            >
              Continue with email
            </button>
          </div>
        ) : (
          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              finishEmail();
            }}
          >
            <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wide text-tide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md border border-hairline px-3 py-2.5 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-depth"
            />
            <button
              type="submit"
              className="rounded-md bg-depth px-4 py-2.5 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="font-mono text-[11px] text-tide transition-colors hover:text-ink"
            >
              Back
            </button>
          </form>
        )}

        <p className="mt-5 font-mono text-[10px] leading-relaxed text-tide">
          No seed phrase, no extension. Your embedded EVM wallet is generated on login and yours to
          export any time.
        </p>
      </div>
    </div>
  );
}

function XMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.3 8.3L23 22h-6.8l-5.3-6.9L4.8 22H1.6l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-2.4 18h1.9L7.6 3.9H5.6L16.5 20Z" />
    </svg>
  );
}
