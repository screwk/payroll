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

    // 1. Try Base58 format (standard Phantom/Web Wallet export format)
    // We try this FIRST because it's the cleanest format.
    try {
        // If it looks like base58 (alphanumeric, no brackets)
        if (!secretKeyString.startsWith("[")) {
            const decoded = bs58.decode(secretKeyString);
            if (decoded.length === 64) {
                return Keypair.fromSecretKey(decoded);
            }
        }
    } catch (err) {
        // Continue to other formats
    }

    // 2. Robust JSON Array Parsing (Regex based)
    // This handles broken JSON, extra commas, "Uint8Array" prefixes, etc.
    try {
        // Extract all numbers from the string
        const matches = secretKeyString.match(/\d+/g);
        if (matches) {
            const numbers = matches.map(Number);
            if (numbers.length === 64) {
                const secretKey = Uint8Array.from(numbers);
                return Keypair.fromSecretKey(secretKey);
            }
        }
    } catch (err) {
        console.warn("[getHotWalletKeypair] Failed regex parsing");
    }

    // 3. Last Resort: Standard JSON Parse
    try {
        if (secretKeyString.startsWith("[")) {
            const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
            return Keypair.fromSecretKey(secretKey);
        }
    } catch (err) {
        // Fail
    }

    // Capture first/last chars for debugging (masked)
    const debugStart = secretKeyString.substring(0, 5);
    const debugEnd = secretKeyString.substring(secretKeyString.length - 5);
    console.error(`[getHotWalletKeypair] FAILED to parse key. Input length: ${secretKeyString.length}. Start: '${debugStart}', End: '${debugEnd}'`);

    throw new Error(`Invalid PAYROLL_SECRET_KEY format (Len: ${secretKeyString.length}). Please use the Base58 format (starts with ~15 chars, ends with ~15 chars).`);
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
