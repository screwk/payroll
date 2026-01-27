"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { AdminProvider } from "@/providers/AdminProvider";

// Dynamically import WalletProvider to avoid SSR issues (wallet adapters need browser APIs)
const WalletProvider = dynamic(
  () => import("@/providers/WalletProvider"),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <AdminProvider>{children}</AdminProvider>
    </WalletProvider>
  );
}
