// Solana Payment Service
// Handles sending SOL payments to raffle creators

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { HOT_WALLET, RPC_ENDPOINT } from "./config";

// Create connection to Solana
export const getConnection = (): Connection => {
  return new Connection(RPC_ENDPOINT, "confirmed");
};

// Convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

// Create a transfer transaction to a specific recipient
// If no recipient specified, defaults to ADMIN_WALLET
export const createTransferTransaction = async (
  fromPubkey: PublicKey,
  amount: number, // in SOL
  recipientWallet?: string // wallet address to receive payment
): Promise<Transaction> => {
  const connection = getConnection();

  // Use provided recipient or default to admin wallet
  const recipient = recipientWallet || HOT_WALLET;
  const toPubkey = new PublicKey(recipient);

  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  // Create transaction
  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: fromPubkey,
  });

  // Add transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: solToLamports(amount),
    })
  );

  return transaction;
};

// Confirm transaction
export const confirmTransaction = async (
  signature: string
): Promise<boolean> => {
  const connection = getConnection();

  try {
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    return !confirmation.value.err;
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return false;
  }
};

// Get wallet balance
export const getBalance = async (publicKey: PublicKey): Promise<number> => {
  const connection = getConnection();
  const balance = await connection.getBalance(publicKey);
  return lamportsToSol(balance);
};

// Check if transaction was successful
export const getTransactionStatus = async (
  signature: string
): Promise<"success" | "failed" | "pending"> => {
  const connection = getConnection();

  try {
    const status = await connection.getSignatureStatus(signature);

    if (!status.value) {
      return "pending";
    }

    if (status.value.err) {
      return "failed";
    }

    if (status.value.confirmationStatus === "confirmed" ||
      status.value.confirmationStatus === "finalized") {
      return "success";
    }

    return "pending";
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return "pending";
  }
};

// Format signature for display
export const shortenSignature = (signature: string, chars: number = 8): string => {
  return `${signature.slice(0, chars)}...${signature.slice(-chars)}`;
};
