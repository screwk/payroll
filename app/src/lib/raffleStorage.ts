// Raffle Storage Service - SUPABASE VERSION (Updated)
import { supabase } from "./supabase";
import { RaffleDisplay } from "@/types/payroll";
import { PublicKey } from "@solana/web3.js";
import { ADMIN_WALLET, ADMIN_WALLETS } from "@/lib/config";

// --- TYPES (Matching Database + Frontend) ---

export type RaffleType = "official" | "community";

export interface Participant {
  id?: string;
  wallet: string;
  raffleId: string;
  tickets: number;
  amountPaid: number;
  isFree: boolean;
  txSignature: string | null;
  enteredAt: string;
  status: "pending" | "confirmed" | "failed";
}

export interface ApprovedCreator {
  wallet: string;
  approvedAt: string;
  approvedBy: string;
  displayName?: string;
  isActive: boolean;
}

export interface StoredRaffle {
  id: string;
  prizeAmount: number;
  ticketPrice: number;
  maxTickets: number;
  ticketsSold: number;
  endTime: string;
  isFree: boolean;
  isDrawn: boolean;
  winningTicket: number | null;
  winner: string | null;
  isClaimed: boolean;
  createdAt: string;
  createdBy: string;
  raffleType: RaffleType;
  creatorDisplayName?: string;
}

// Generate unique ID (Still useful for optimistic updates or internal logic)
const generateId = (): string => {
  return `raffle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ============ APPROVED CREATORS ============

export const getApprovedCreators = async (): Promise<ApprovedCreator[]> => {
  const { data, error } = await supabase
    .from('approved_creators')
    .select('*');

  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }

  // Map snake_case (DB) to camelCase (App) if needed?
  // Our schema used snake_case for columns like approved_at.
  // Supabase returns objects matching column names.
  // We need to map them to conform to the Interface.

  return data.map((c: any) => ({
    wallet: c.wallet,
    approvedAt: c.approved_at,
    approvedBy: c.approved_by,
    displayName: c.display_name,
    isActive: c.is_active
  }));
};

export const isApprovedCreator = async (wallet: string): Promise<boolean> => {
  if (ADMIN_WALLETS.includes(wallet)) return true;

  const { data } = await supabase
    .from('approved_creators')
    .select('is_active')
    .eq('wallet', wallet)
    .single();

  return data?.is_active || false;
};

export const canCreateRaffles = async (wallet: string): Promise<boolean> => {
  return ADMIN_WALLETS.includes(wallet) || await isApprovedCreator(wallet);
};

export const getCreatorInfo = async (wallet: string): Promise<ApprovedCreator | null> => {
  if (ADMIN_WALLETS.includes(wallet)) {
    return {
      wallet: ADMIN_WALLET,
      approvedAt: new Date().toISOString(),
      approvedBy: ADMIN_WALLET,
      displayName: "PAYROLL Official",
      isActive: true,
    };
  }

  const { data } = await supabase
    .from('approved_creators')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (!data) return null;

  return {
    wallet: data.wallet,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    displayName: data.display_name,
    isActive: data.is_active
  };
};

export const approveCreator = async (data: {
  wallet: string;
  approvedBy: string;
  displayName?: string;
}): Promise<ApprovedCreator | null> => {
  if (!ADMIN_WALLETS.includes(data.approvedBy)) return null;

  const { data: result, error } = await supabase
    .from('approved_creators')
    .upsert({
      wallet: data.wallet,
      approved_by: data.approvedBy,
      display_name: data.displayName,
      is_active: true,
      approved_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !result) {
    console.error("Error approving creator:", error);
    return null;
  }

  return {
    wallet: result.wallet,
    approvedAt: result.approved_at,
    approvedBy: result.approved_by,
    displayName: result.display_name,
    isActive: result.is_active
  };
};

export const revokeCreator = async (wallet: string, adminWallet: string): Promise<boolean> => {
  if (!ADMIN_WALLETS.includes(adminWallet)) return false;

  const { error } = await supabase
    .from('approved_creators')
    .update({ is_active: false })
    .eq('wallet', wallet);

  return !error;
};

export const updateCreatorDisplayName = async (wallet: string, displayName: string): Promise<ApprovedCreator | null> => {
  const { data, error } = await supabase
    .from('approved_creators')
    .update({ display_name: displayName })
    .eq('wallet', wallet)
    .select()
    .single();

  if (error || !data) return null;

  return {
    wallet: data.wallet,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    displayName: data.display_name,
    isActive: data.is_active
  };
};

// ============ RAFFLES ============

// Helper to map DB row to StoredRaffle interface
const mapRaffleRow = (row: any): StoredRaffle => ({
  id: row.id,
  prizeAmount: row.prize_amount,
  ticketPrice: row.ticket_price,
  maxTickets: row.max_tickets,
  ticketsSold: row.tickets_sold,
  endTime: row.end_time,
  isFree: row.is_free,
  isDrawn: row.is_drawn,
  winningTicket: row.winning_ticket,
  winner: row.winner_wallet,
  isClaimed: row.is_claimed,
  createdAt: row.created_at,
  createdBy: row.created_by,
  raffleType: row.raffle_type as RaffleType,
  creatorDisplayName: row.creator_display_name
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

export const getRafflesByCreator = async (creatorWallet: string): Promise<RaffleDisplay[]> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('created_by', creatorWallet)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data.map(mapRaffleRow).map(toRaffleDisplay);
};

export const createRaffle = async (data: {
  prizeAmount: number;
  ticketPrice: number;
  maxTickets: number;
  durationHours: number;
  isFree: boolean;
  createdBy: string;
  displayName?: string;
}): Promise<StoredRaffle | null> => {
  console.log("[createRaffle] Creating for:", data.createdBy);
  console.log("[createRaffle] Target Admin:", ADMIN_WALLET);
  const isAuthorized = await canCreateRaffles(data.createdBy);
  console.log("[createRaffle] Is authorized:", isAuthorized);
  if (!isAuthorized) return null;

  const endTime = new Date();
  endTime.setHours(endTime.getHours() + data.durationHours);

  const raffleType = ADMIN_WALLETS.includes(data.createdBy) ? "official" : "community";

  // Get Display Name
  let creatorDisplayName = data.displayName || "";
  if (!creatorDisplayName) {
    const creatorInfo = await getCreatorInfo(data.createdBy);
    if (creatorInfo) {
      creatorDisplayName = creatorInfo.displayName || "";
    }
  }

  const raffleId = generateId();

  const { data: newRaffle, error } = await supabase
    .from('raffles')
    .insert({
      id: raffleId,
      prize_amount: data.prizeAmount,
      ticket_price: data.isFree ? 0 : data.ticketPrice,
      max_tickets: data.maxTickets,
      tickets_sold: 0,
      end_time: endTime.toISOString(),
      is_free: data.isFree,
      created_by: data.createdBy,
      raffle_type: raffleType,
      creator_display_name: creatorDisplayName
    })
    .select()
    .single();

  if (error) {
    console.error("[createRaffle] Supabase Error:", error);
    return null;
  }
  if (!newRaffle) {
    console.error("Error creating raffle: newRaffle is null after insert.");
    return null;
  }

  return mapRaffleRow(newRaffle);
};

export const deleteRaffle = async (id: string): Promise<{ success: boolean; error?: string; rowsAffected?: number }> => {
  try {
    console.log(`[deleteRaffle] Attempting to delete raffle: ${id}`);

    // 1. Delete associated participants first
    const { error: partError, count: partCount } = await supabase
      .from('participants')
      .delete({ count: 'exact' })
      .eq('raffle_id', id);

    if (partError) {
      console.error("[deleteRaffle] Error deleting participants:", partError);
      return { success: false, error: `Failed to clear participants: ${partError.message}` };
    }
    console.log(`[deleteRaffle] Participants deleted: ${partCount || 0}`);

    // 2. Delete the raffle itself and check if it actually existed
    const { error: raffleError, count: raffleCount } = await supabase
      .from('raffles')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (raffleError) {
      console.error("[deleteRaffle] Error deleting raffle:", raffleError);
      return { success: false, error: `Failed to delete raffle: ${raffleError.message}` };
    }

    if (raffleCount === 0) {
      console.warn(`[deleteRaffle] No raffle found with ID: ${id}. It may have already been deleted or RLS is blocking the operation.`);
      return { success: false, error: "No raffle was found to delete. This usually means the database blocked the request due to permissions (RLS).", rowsAffected: 0 };
    }

    console.log(`[deleteRaffle] Successfully deleted raffle: ${id} (Rows affected: ${raffleCount})`);
    return { success: true, rowsAffected: raffleCount || 0 };
  } catch (err: any) {
    console.error("[deleteRaffle] Unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
};

// ============ PARTICIPANTS ============

const mapParticipantRow = (row: any): Participant => ({
  id: row.id,
  wallet: row.wallet,
  raffleId: row.raffle_id,
  tickets: row.tickets,
  amountPaid: row.amount_paid,
  isFree: row.is_free,
  txSignature: row.tx_signature,
  enteredAt: row.entered_at,
  status: row.status
});

export const getAllParticipants = async (): Promise<Participant[]> => {
  const { data, error } = await supabase.from('participants').select('*');
  if (error) return [];
  return data.map(mapParticipantRow);
};

export const getRaffleParticipants = async (raffleId: string): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('raffle_id', raffleId);

  if (error) return [];
  return data.map(mapParticipantRow);
};

export const getAllParticipantsForAdmin = async (): Promise<(Participant & { rafflePrize?: number })[]> => {
  const [participants, raffles] = await Promise.all([
    getAllParticipants(),
    getRaffles()
  ]);

  return participants.map(p => {
    const raffle = raffles.find(r => r.id === p.raffleId);
    return {
      ...p,
      rafflePrize: raffle?.prizeAmount
    };
  }).sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
};

// Enter Raffle (Transaction + DB Update)
export const enterRaffle = async (data: {
  wallet: string;
  raffleId: string;
  tickets: number;
  amountPaid: number;
  isFree: boolean;
  txSignature: string | null;
  status: "pending" | "confirmed" | "failed";
}): Promise<{ participant: Participant | null; raffle: StoredRaffle | null }> => {

  // 1. Check if user exists in this raffle
  const { data: existing } = await supabase
    .from('participants')
    .select('*')
    .eq('wallet', data.wallet)
    .eq('raffle_id', data.raffleId)
    .single();

  let participant = null;

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('participants')
      .update({
        tickets: existing.tickets + data.tickets,
        amount_paid: Number(existing.amount_paid) + data.amountPaid,
        status: data.status,
        tx_signature: data.txSignature || existing.tx_signature,
        entered_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updated) participant = mapParticipantRow(updated);
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from('participants')
      .insert({
        wallet: data.wallet,
        raffle_id: data.raffleId,
        tickets: data.tickets,
        amount_paid: data.amountPaid,
        is_free: data.isFree,
        tx_signature: data.txSignature,
        status: data.status
      })
      .select()
      .single();

    if (inserted) participant = mapParticipantRow(inserted);
  }

  // 2. Update Raffle Ticket Count
  let raffle = null;
  if (data.status === "confirmed" || data.isFree) {
    // Get current tickets sold
    const { data: currentRaffle } = await supabase
      .from('raffles')
      .select('tickets_sold')
      .eq('id', data.raffleId)
      .single();

    if (currentRaffle) {
      const newCount = currentRaffle.tickets_sold + data.tickets;
      const { data: updatedRaffle } = await supabase
        .from('raffles')
        .update({ tickets_sold: newCount })
        .eq('id', data.raffleId)
        .select()
        .single();

      if (updatedRaffle) raffle = mapRaffleRow(updatedRaffle);
    }
  }

  return { participant, raffle };
};

// ============ DRAWING ============

export const drawWinner = async (raffleId: string): Promise<StoredRaffle | null> => {
  // 1. Get Participants
  const { data: participantsData } = await supabase
    .from('participants')
    .select('*')
    .eq('raffle_id', raffleId)
    .eq('status', 'confirmed'); // Only confirmed entries

  if (!participantsData || participantsData.length === 0) return null;

  // 2. Weighted Random
  const weightedWallets: string[] = [];
  participantsData.forEach((p: any) => {
    for (let i = 0; i < p.tickets; i++) {
      weightedWallets.push(p.wallet);
    }
  });

  if (weightedWallets.length === 0) return null;

  const winningIndex = Math.floor(Math.random() * weightedWallets.length);
  const winnerWallet = weightedWallets[winningIndex];

  // 3. Update Raffle
  const { data: updatedRaffle, error } = await supabase
    .from('raffles')
    .update({
      is_drawn: true,
      winning_ticket: winningIndex + 1,
      winner_wallet: winnerWallet
    })
    .eq('id', raffleId)
    .select()
    .single();

  if (error || !updatedRaffle) return null;
  return mapRaffleRow(updatedRaffle);
};

// ============ DISPLAY HELPERS ============

export const toRaffleDisplay = (stored: StoredRaffle): RaffleDisplay => {
  const endTime = new Date(stored.endTime);
  const isEnded = endTime.getTime() < Date.now();

  return {
    id: stored.id,
    publicKey: {} as PublicKey,
    prizeAmount: stored.prizeAmount,
    ticketPrice: stored.ticketPrice,
    maxTickets: stored.maxTickets,
    ticketsSold: stored.ticketsSold,
    endTime,
    isFree: stored.isFree,
    isDrawn: stored.isDrawn,
    winningTicket: stored.winningTicket || 0,
    winner: stored.winner,
    isClaimed: stored.isClaimed,
    timeRemaining: "",
    isEnded,
    participantCount: stored.ticketsSold,
    raffleType: stored.raffleType,
    createdBy: stored.createdBy,
    creatorDisplayName: stored.creatorDisplayName,
  };
};

export const getRafflesForDisplay = async (): Promise<RaffleDisplay[]> => {
  const raffles = await getRaffles();
  return raffles.map(toRaffleDisplay);
};

export const getUserEntries = async (walletAddress: string): Promise<any[]> => {
  const { data: participants } = await supabase
    .from('participants')
    .select(`
      *,
      raffles:raffle_id (
        prize_amount,
        end_time,
        winner_wallet,
        is_drawn
      )
    `)
    .eq('wallet', walletAddress)
    .order('entered_at', { ascending: false });

  if (!participants) return [];

  return participants.map((p: any) => ({
    wallet: p.wallet,
    raffleId: p.raffle_id,
    tickets: p.tickets,
    amountPaid: p.amount_paid,
    isFree: p.is_free,
    txSignature: p.tx_signature,
    enteredAt: p.entered_at,
    status: p.status,
    rafflePrize: p.raffles?.prize_amount,
    raffleEndTime: p.raffles?.end_time,
    isWinner: p.raffles?.winner_wallet === walletAddress,
    raffleIsDrawn: p.raffles?.is_drawn
  }));
};
