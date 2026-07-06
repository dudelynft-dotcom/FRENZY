import { SILHOUETTES, TIER_NAMES } from "@/components/arena/game";

const COLORWAYS = [
  { body: "#46687F", dark: "#324E61", belly: "#A9BDC7" }, // slate
  { body: "#4E7367", dark: "#38564C", belly: "#AEC4B8" }, // kelp
  { body: "#8C7F63", dark: "#665C46", belly: "#CBC2A6" }, // sand
] as const;
const GOLD_BROWN = { body: "#6E5A2E", dark: "#4A3D1E", belly: "#C8B989" };

function colorFor(ch: string, pal: { body: string; dark: string; belly: string }, gold: boolean): string | null {
  switch (ch) {
    case ".":
      return null;
    case "s":
      return pal.belly;
    case "d":
    case "f":
      return pal.dark;
    case "e":
    case "j":
      return "#F7F8F6";
    case "p":
      return "#10222E";
    case "g":
      return gold ? "#8A6D2F" : pal.dark;
    default:
      return pal.body;
  }
}

/** Static SVG pixel fish (same silhouettes as the live game) for cards/dashboards. */
export function PixelFish({
  tier,
  seed = 1,
  size = 120,
  className,
}: {
  tier: number;
  seed?: number;
  size?: number;
  className?: string;
}) {
  const t = Math.min(6, Math.max(1, tier));
  const sil = SILHOUETTES[t] ?? SILHOUETTES[1];
  const rows = sil.length;
  const cols = Math.max(...sil.map((r) => r.length));
  const pal = t >= 5 ? GOLD_BROWN : COLORWAYS[seed % COLORWAYS.length];
  const gold = t >= 5;

  const rects: { x: number; y: number; fill: string }[] = [];
  sil.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const fill = colorFor(row[x], pal, gold);
      if (fill) rects.push({ x, y, fill });
    }
  });

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={(size * rows) / cols}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${TIER_NAMES[t - 1]} fish`}
      className={className}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.02} height={1.02} fill={r.fill} />
      ))}
    </svg>
  );
}
