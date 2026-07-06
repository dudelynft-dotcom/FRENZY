/** Wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={
        className
          ? `font-display text-[15px] font-semibold tracking-tight text-ink ${className}`
          : "font-display text-[15px] font-semibold tracking-tight text-ink"
      }
    >
      FEEDING FRENZY
    </span>
  );
}
