// PAYROLL Program IDL Types
// This matches the Anchor program structure

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const PROGRAM_ID = new PublicKey(
  "PayRo11111111111111111111111111111111111111"
);

export interface Platform {
  admin: PublicKey;
  totalRaffles: BN;
  bump: number;
}

export interface Raffle {
  id: BN;
  admin: PublicKey;
  prizeAmount: BN;
  ticketPrice: BN;
  maxTickets: number;
  ticketsSold: number;
  endTime: BN;
  isFree: boolean;
  isDrawn: boolean;
  winningTicket: number;
  winner: PublicKey | null;
  isClaimed: boolean;
  bump: number;
  vaultBump: number;
}

export interface Ticket {
  raffle: PublicKey;
  owner: PublicKey;
  startNumber: number;
  quantity: number;
  bump: number;
}

// Raffle types
export type RaffleType = "official" | "community";

// Frontend-friendly raffle type
export interface RaffleDisplay {
  id: string;
  publicKey: PublicKey;
  prizeAmount: number; // in SOL
  ticketPrice: number; // in SOL
  maxTickets: number;
  ticketsSold: number;
  endTime: Date;
  isFree: boolean;
  isDrawn: boolean;
  winningTicket: number;
  winner: string | null;
  isClaimed: boolean;
  timeRemaining: string;
  isEnded: boolean;
  participantCount: number;
  // NEW: Community raffle support
  raffleType?: RaffleType;
  createdBy?: string;
  creatorDisplayName?: string;
}

// Convert lamports to SOL
export const lamportsToSol = (lamports: BN | number): number => {
  const value = typeof lamports === "number" ? lamports : lamports.toNumber();
  return value / 1_000_000_000;
};

// Convert SOL to lamports
export const solToLamports = (sol: number): BN => {
  return new BN(sol * 1_000_000_000);
};

// Format time remaining
export const formatTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Shorten wallet address
export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
