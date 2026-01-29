// Raffle Storage Service - WEB2.5 SUPABASE VERSION
import { supabase } from "./supabase";
import { RaffleDisplay } from "@/types/payroll";
import { PublicKey } from "@solana/web3.js";
import { ADMIN_WALLETS } from "@/lib/config";

// --- TYPES (Matching Database + Frontend) ---

export interface Participant {
  id?: string;
  wallet: string;
  raffleId: string;
  quantity: number;
  txSignature: string;
  isVerified: boolean;
  createdAt: string;
}

export interface StoredRaffle {
  id: string;
  title: string;
  description: string | null;
  prizeAmount: number;
  ticketPrice: number;
  maxTickets: number;
  ticketsSold: number;
  totalRevenue: number;
  endTime: string;
  status: 'waiting_deposit' | 'active' | 'drawn' | 'pending_payout' | 'completed' | 'refunded' | 'cancelled';
  creatorWallet: string;
  winnerWallet: string | null;
  depositTxSignature: string | null;
  prizeTxSignature: string | null;
  payoutTxSignature: string | null;
  drawnAt: string | null;
  createdAt: string;
}

// Helper to map DB row to StoredRaffle interface
const mapRaffleRow = (row: any): StoredRaffle => ({
  id: row.id,
  title: row.title,
  description: row.description,
  prizeAmount: row.prize_amount,
  ticketPrice: row.ticket_price,
  maxTickets: row.max_tickets,
  ticketsSold: row.tickets_sold,
  totalRevenue: row.total_revenue || 0,
  endTime: row.end_time,
  status: row.status as any,
  creatorWallet: row.creator_wallet,
  winnerWallet: row.winner_wallet,
  depositTxSignature: row.deposit_tx_signature,
  prizeTxSignature: row.prize_tx_signature,
  payoutTxSignature: row.payout_tx_signature,
  drawnAt: row.drawn_at,
  createdAt: row.created_at
});

export const getRaffles = async (): Promise<StoredRaffle[]> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching raffles:", error);
    return [];
  }

  return data.map(mapRaffleRow);
};

export const getRaffleById = async (id: string): Promise<StoredRaffle | null> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRaffleRow(data);
};

export const createRaffle = async (data: {
  title: string;
  description: string;
  prizeAmount: number;
  ticketPrice: number;
  maxTickets: number;
  durationHours: number;
  creatorWallet: string;
}): Promise<StoredRaffle | null> => {
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + data.durationHours);

  const { data: newRaffle, error } = await supabase
    .from('raffles')
    .insert({
      title: data.title,
      description: data.description,
      prize_amount: data.prizeAmount,
      ticket_price: data.ticketPrice,
      max_tickets: Math.min(data.maxTickets, 100), // Limit to 100
      end_time: endTime.toISOString(),
      creator_wallet: data.creatorWallet,
      status: 'waiting_deposit' // Force waiting for deposit
    })
    .select()
    .single();

  if (error) {
    console.error("[createRaffle] Supabase Error:", error);
    return null;
  }

  return mapRaffleRow(newRaffle);
};

// ============ PARTICIPANTS ============

const mapParticipantRow = (row: any): Participant => ({
  id: row.id,
  wallet: row.user_wallet,
  raffleId: row.raffle_id,
  quantity: row.quantity,
  txSignature: row.tx_signature,
  isVerified: row.is_verified,
  createdAt: row.created_at
});

export const getRaffleParticipants = async (raffleId: string): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId);

  if (error) return [];
  return data.map(mapParticipantRow);
};

export const buyTickets = async (data: {
  raffleId: string;
  userWallet: string;
  quantity: number;
  txSignature: string;
}): Promise<boolean> => {
  const { error } = await supabase
    .from('tickets')
    .insert({
      raffle_id: data.raffleId,
      user_wallet: data.userWallet,
      quantity: data.quantity,
      tx_signature: data.txSignature,
      is_verified: false // Server will verify later
    });

  if (error) {
    console.error("[buyTickets] Error:", error);
    return false;
  }

  return true;
};

export const deleteRaffle = async (id: string, adminWallet?: string): Promise<{ success: boolean; error?: string }> => {
  if (!adminWallet) return { success: false, error: "Wallet not connected" };

  try {
    const response = await fetch("/api/raffle/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raffleId: id, adminWallet }),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Failed to delete from API" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[deleteRaffle] API Error:", err);
    return { success: false, error: err.message };
  }
};

// ============ DISPLAY HELPERS ============

export const toRaffleDisplay = (stored: StoredRaffle): RaffleDisplay => {
  const endTime = new Date(stored.endTime);
  const isEnded = endTime.getTime() < Date.now();

  return {
    id: stored.id,
    publicKey: {} as PublicKey, // Not using chain PDA here
    prizeAmount: stored.prizeAmount,
    ticketPrice: stored.ticketPrice,
    maxTickets: stored.maxTickets,
    ticketsSold: stored.ticketsSold,
    endTime,
    isFree: stored.ticketPrice === 0,
    isDrawn: stored.status !== 'active' && stored.status !== 'waiting_deposit',
    winningTicket: 0,
    winner: stored.winnerWallet,
    isClaimed: !!stored.prizeTxSignature,
    timeRemaining: "",
    isEnded,
    participantCount: stored.ticketsSold,
    raffleType: ADMIN_WALLETS.includes(stored.creatorWallet) ? "official" : "community",
    createdBy: stored.creatorWallet,
    creatorDisplayName: "", // Could be fetched from a profiles table
  };
};

export const getRafflesForDisplay = async (): Promise<RaffleDisplay[]> => {
  const raffles = await getRaffles();
  return raffles
    .filter(r => r.status !== 'waiting_deposit') // Show all that are not waiting deposit
    .map(toRaffleDisplay);
};

export const getUserEntries = async (wallet: string): Promise<(Participant & { raffle?: StoredRaffle })[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, raffles (*)')
    .eq('user_wallet', wallet);

  if (error) {
    console.error("[getUserEntries] Error:", error);
    return [];
  }

  return data.map(row => ({
    ...mapParticipantRow(row),
    raffle: row.raffles ? mapRaffleRow(row.raffles) : undefined
  }));
};

export const canCreateRaffles = (wallet: string | null | undefined): boolean => {
  return !!wallet; // Anyone with a wallet can create!
};
