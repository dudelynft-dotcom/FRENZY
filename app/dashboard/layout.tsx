import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your fish, your $CHUM, upgrades, withdrawals, and the weekly leaderboard.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
