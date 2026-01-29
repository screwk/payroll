"use client";

import { createContext, useContext, ReactNode, useMemo, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ADMIN_WALLETS, ADMIN_WALLET, OWNER_WALLET } from "@/lib/config";

interface AdminContextType {
  isAdmin: boolean;
  isOwner: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  adminWallets: string[];
  isReady: boolean;
}

const defaultContext: AdminContextType = {
  isAdmin: false,
  isOwner: false,
  isConnected: false,
  walletAddress: null,
  adminWallets: ADMIN_WALLETS,
  isReady: false,
};

const AdminContext = createContext<AdminContextType>(defaultContext);

export const useAdmin = () => useContext(AdminContext);

interface Props {
  children: ReactNode;
}

export function AdminProvider({ children }: Props) {
  const { publicKey, connected } = useWallet();
  const [isReady, setIsReady] = useState(false);

  // Mark as ready after first render (client-side)
  useEffect(() => {
    setIsReady(true);
  }, []);

  const value = useMemo(() => {
    const walletAddress = publicKey?.toString() || null;
    const isOwner = connected && walletAddress === OWNER_WALLET;
    const isAdmin = connected && walletAddress && (ADMIN_WALLETS.includes(walletAddress) || isOwner);

    if (connected) {
      console.log("[AdminProvider] Wallet: ", walletAddress);
      console.log("[AdminProvider] Is Owner: ", isOwner);
      console.log("[AdminProvider] Is Admin: ", isAdmin);
    }

    return {
      isAdmin: !!isAdmin,
      isOwner: !!isOwner,
      isConnected: connected,
      walletAddress,
      adminWallets: ADMIN_WALLETS,
      isReady,
    };
  }, [publicKey, connected, isReady]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export default AdminProvider;
