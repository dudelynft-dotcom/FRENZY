import type { Metadata } from "next";
import { FishArena } from "@/components/arena/FishArena";

export const metadata: Metadata = {
  title: "Play",
  description: "Enter the water. Hunt fish for $CHUM, surface to secure your winnings, and never lose your deposit.",
};

export default function PlayPage() {
  return (
    <div className="mx-auto flex max-w-shell flex-col gap-4">
      <FishArena />
    </div>
  );
}
