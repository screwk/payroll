import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./config";
import bs58 from "bs58";

/**
 * Server-side utility to interact with the Hot Wallet
 */
export const getHotWalletKeypair = () => {
    let secretKeyString = process.env.PAYROLL_SECRET_KEY;
    if (!secretKeyString) {
        throw new Error("PAYROLL_SECRET_KEY not found in environment variables");
    }

    // Clean the string: remove whitespace and any accidental wrapping quotes
    secretKeyString = secretKeyString.trim();
    if ((secretKeyString.startsWith('"') && secretKeyString.endsWith('"')) ||
        (secretKeyString.startsWith("'") && secretKeyString.endsWith("'"))) {
        secretKeyString = secretKeyString.slice(1, -1).trim();
    }

    // Try JSON array format first (standard Solana CLI id.json format)
    try {
        if (secretKeyString.startsWith("[")) {
            const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
            return Keypair.fromSecretKey(secretKey);
        }
    } catch (err) {
        console.warn("[getHotWalletKeypair] Failed to parse as JSON array, trying Base58...");
    }

    // Try Base58 format (standard Phantom/Web Wallet export format)
    try {
        const decoded = bs58.decode(secretKeyString);
        return Keypair.fromSecretKey(decoded);
    } catch (err) {
        // Log diagnostic info (safely)
        console.error(`[getHotWalletKeypair] Format error. Length: ${secretKeyString.length}, Starts: ${secretKeyString.substring(0, 3)}..., Ends: ...${secretKeyString.substring(secretKeyString.length - 3)}`);
        throw new Error("Invalid PAYROLL_SECRET_KEY format. Expected a JSON array [1,2,3...] OR a Base58 string.");
    }
};

/**
 * Sends SOL from the Hot Wallet to a recipient
 */
export const sendPrize = async (recipientWallet: string, amount: number) => {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const hotWallet = getHotWalletKeypair();

    const recipient = new PublicKey(recipientWallet);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: hotWallet.publicKey,
            toPubkey: recipient,
            lamports: amount * LAMPORTS_PER_SOL,
        })
    );

    const signature = await connection.sendTransaction(transaction, [hotWallet]);
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
};
