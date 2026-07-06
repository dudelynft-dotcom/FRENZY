import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="font-display text-2xl text-ink">Nothing swims here</h1>
      <p className="max-w-sm font-mono text-sm text-tide">
        This page doesn&apos;t exist, or it was eaten. The arena is one link away.
      </p>
      <Link
        href="/"
        className="rounded-md bg-depth px-4 py-2 font-mono text-sm text-porcelain outline-none transition-colors hover:bg-depth/90 focus-visible:ring-2 focus-visible:ring-depth focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain"
      >
        Back to the arena
      </Link>
    </div>
  );
}
