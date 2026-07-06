import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shop",
  description: "Fish skins and flair. Every purchase funds the weekly prize pool and the treasury. Nobody loses for you to earn.",
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
