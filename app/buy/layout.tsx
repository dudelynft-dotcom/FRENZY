import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Buy $CHUM",
  description: "Buy $CHUM on a simple bonding curve. 10B supply, $100,000 starting FDV, price rises 0.05% per $1,000 bought.",
};

export default function BuyLayout({ children }: { children: ReactNode }) {
  return children;
}
