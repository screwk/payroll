"use client";

import { useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID, Raffle, Ticket, solToLamports } from "@/types/payroll";

export const usePayroll = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Create Anchor provider and program
  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );
  }, [connection, wallet]);

  const program = useMemo((): any => {
    if (!provider) return null;
    // Anchor 0.30+ uses (idl, provider) format
    return new Program(IDL as any, provider);
  }, [provider]);

  // PDA derivation helpers
  const getPlatformPDA = useCallback(() => {
    return PublicKey.findProgramAddressSync([Buffer.from("platform")], PROGRAM_ID);
  }, []);

  const getRafflePDA = useCallback((raffleId: number | BN) => {
    const id = typeof raffleId === "number" ? new BN(raffleId) : raffleId;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("raffle"), id.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );
  }, []);

  const getRaffleVaultPDA = useCallback((raffleId: number | BN) => {
    const id = typeof raffleId === "number" ? new BN(raffleId) : raffleId;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("raffle_vault"), id.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );
  }, []);

  const getTicketPDA = useCallback(
    (rafflePubkey: PublicKey, buyer: PublicKey) => {
      return PublicKey.findProgramAddressSync(
        [Buffer.from("ticket"), rafflePubkey.toBuffer(), buyer.toBuffer()],
        PROGRAM_ID
      );
    },
    []
  );

  // Initialize platform (admin only, one-time)
  const initializePlatform = useCallback(async () => {
    if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

    const [platformPDA] = getPlatformPDA();

    const tx = await program.methods
      .initialize()
      .accounts({
        platform: platformPDA,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }, [program, wallet.publicKey, getPlatformPDA]);

  // Create a new raffle (admin only)
  const createRaffle = useCallback(
    async (
      raffleId: number,
      prizeAmountSol: number,
      ticketPriceSol: number,
      maxTickets: number,
      durationSeconds: number,
      isFree: boolean
    ) => {
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const [platformPDA] = getPlatformPDA();
      const [rafflePDA] = getRafflePDA(raffleId);
      const [vaultPDA] = getRaffleVaultPDA(raffleId);

      const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

      const tx = await program.methods
        .createRaffle(
          new BN(raffleId),
          solToLamports(prizeAmountSol),
          solToLamports(ticketPriceSol),
          maxTickets,
          new BN(endTime),
          isFree
        )
        .accounts({
          platform: platformPDA,
          raffle: rafflePDA,
          raffleVault: vaultPDA,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet.publicKey, getPlatformPDA, getRafflePDA, getRaffleVaultPDA]
  );

  // Buy tickets
  const buyTicket = useCallback(
    async (raffleId: number, quantity: number) => {
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const [rafflePDA] = getRafflePDA(raffleId);
      const [vaultPDA] = getRaffleVaultPDA(raffleId);
      const [ticketPDA] = getTicketPDA(rafflePDA, wallet.publicKey);

      const tx = await program.methods
        .buyTicket(quantity)
        .accounts({
          raffle: rafflePDA,
          ticket: ticketPDA,
          raffleVault: vaultPDA,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet.publicKey, getRafflePDA, getRaffleVaultPDA, getTicketPDA]
  );

  // Draw winner (can be called by anyone after raffle ends)
  const drawWinner = useCallback(
    async (raffleId: number) => {
      if (!program) throw new Error("Program not initialized");

      const [rafflePDA] = getRafflePDA(raffleId);

      const tx = await program.methods
        .drawWinner()
        .accounts({
          raffle: rafflePDA,
        })
        .rpc();

      return tx;
    },
    [program, getRafflePDA]
  );

  // Set winner (requires winning ticket proof)
  const setWinner = useCallback(
    async (raffleId: number, winnerPubkey: PublicKey) => {
      if (!program) throw new Error("Program not initialized");

      const [rafflePDA] = getRafflePDA(raffleId);
      const [ticketPDA] = getTicketPDA(rafflePDA, winnerPubkey);

      const tx = await program.methods
        .setWinner()
        .accounts({
          raffle: rafflePDA,
          winningTicket: ticketPDA,
        })
        .rpc();

      return tx;
    },
    [program, getRafflePDA, getTicketPDA]
  );

  // Claim prize (winner only)
  const claimPrize = useCallback(
    async (raffleId: number) => {
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const [rafflePDA] = getRafflePDA(raffleId);
      const [vaultPDA] = getRaffleVaultPDA(raffleId);

      const tx = await program.methods
        .claimPrize()
        .accounts({
          raffle: rafflePDA,
          raffleVault: vaultPDA,
          winner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet.publicKey, getRafflePDA, getRaffleVaultPDA]
  );

  // Withdraw proceeds (admin only)
  const withdrawProceeds = useCallback(
    async (raffleId: number) => {
      if (!program || !wallet.publicKey) throw new Error("Wallet not connected");

      const [platformPDA] = getPlatformPDA();
      const [rafflePDA] = getRafflePDA(raffleId);
      const [vaultPDA] = getRaffleVaultPDA(raffleId);

      const tx = await program.methods
        .withdrawProceeds()
        .accounts({
          platform: platformPDA,
          raffle: rafflePDA,
          raffleVault: vaultPDA,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [program, wallet.publicKey, getPlatformPDA, getRafflePDA, getRaffleVaultPDA]
  );

  // Fetch all raffles
  const fetchAllRaffles = useCallback(async (): Promise<Raffle[]> => {
    if (!program) return [];

    try {
      const accounts = await program.account.raffle.all();
      return accounts.map((a: any) => a.account as Raffle);
    } catch (e) {
      console.error("Error fetching raffles:", e);
      return [];
    }
  }, [program]);

  // Fetch single raffle
  const fetchRaffle = useCallback(
    async (raffleId: number): Promise<Raffle | null> => {
      if (!program) return null;

      const [rafflePDA] = getRafflePDA(raffleId);
      try {
        const account = await program.account.raffle.fetch(rafflePDA);
        return account as unknown as Raffle;
      } catch {
        return null;
      }
    },
    [program, getRafflePDA]
  );

  // Fetch user's ticket for a raffle
  const fetchUserTicket = useCallback(
    async (raffleId: number): Promise<Ticket | null> => {
      if (!program || !wallet.publicKey) return null;

      const [rafflePDA] = getRafflePDA(raffleId);
      const [ticketPDA] = getTicketPDA(rafflePDA, wallet.publicKey);

      try {
        const account = await program.account.ticket.fetch(ticketPDA);
        return account as unknown as Ticket;
      } catch {
        return null;
      }
    },
    [program, wallet.publicKey, getRafflePDA, getTicketPDA]
  );

  return {
    program,
    provider,
    wallet,
    connected: wallet.connected,
    publicKey: wallet.publicKey,

    // PDAs
    getPlatformPDA,
    getRafflePDA,
    getRaffleVaultPDA,
    getTicketPDA,

    // Instructions
    initializePlatform,
    createRaffle,
    buyTicket,
    drawWinner,
    setWinner,
    claimPrize,
    withdrawProceeds,

    // Queries
    fetchAllRaffles,
    fetchRaffle,
    fetchUserTicket,
  };
};

export default usePayroll;
