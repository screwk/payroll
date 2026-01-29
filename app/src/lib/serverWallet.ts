import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./config";
import bs58 from "bs58";

/**
 * Server-side utility to interact with the Hot Wallet
 */
export const getHotWalletKeypair = () => {
    // Support both variable names
    let secretKeyString = process.env.PAYROLL_APP_SECRET || process.env.PAYROLL_SECRET_KEY;
    if (!secretKeyString) {
        throw new Error("PAYROLL_APP_SECRET (or PAYROLL_SECRET_KEY) not found. Please add this variable to Vercel.");
    }

    // Clean the string: remove whitespace and any accidental wrapping quotes
    secretKeyString = secretKeyString.trim();
    if ((secretKeyString.startsWith('"') && secretKeyString.endsWith('"')) ||
        (secretKeyString.startsWith("'") && secretKeyString.endsWith("'"))) {
        secretKeyString = secretKeyString.slice(1, -1).trim();
    }

    // Prepare bs58 decoder safely (handle CJS/ESM impedance mismatch)
    let decodeBase58: ((input: string) => Uint8Array) | undefined;
    try {
        if (typeof bs58 === 'function') {
            // @ts-ignore
            decodeBase58 = bs58;
        } else if (typeof bs58 === 'object') {
            // @ts-ignore
            // @ts-ignore
            decodeBase58 = bs58.decode || bs58.default?.decode;
        }
    } catch (e) {
        console.warn("bs58 import detection failed:", e);
    }

    let lastError = "";

    // 1. Try Base58 format (Standard)
    if (!secretKeyString.startsWith("[")) {
        if (decodeBase58) {
            try {
                const decoded = decodeBase58(secretKeyString);
                if (decoded.length === 64) {
                    return Keypair.fromSecretKey(decoded);
                } else if (decoded.length === 65) {
                    // Sometimes bs58 decoding + environment weirdness adds a byte.
                    // Try simply slicing it.
                    try {
                        return Keypair.fromSecretKey(decoded.slice(0, 64));
                    } catch (e) {
                        try {
                            return Keypair.fromSecretKey(decoded.slice(1, 65));
                        } catch (e2) {
                            lastError = `Base58 decode length 65 correction failed.`;
                        }
                    }
                } else {
                    lastError = `Base58 decode length mismatch: ${decoded.length} (expected 64).`;
                }
            } catch (err: any) {
                lastError = `Base58 decode failed: ${err.message}`;
            }
        } else {
            lastError = "bs58 library not available/detected correctly.";
        }
    }

    // 2. Robust JSON Array Parsing (Regex based)
    try {
        const matches = secretKeyString.match(/\d+/g);
        if (matches) {
            const numbers = matches.map(Number);
            if (numbers.length === 64) {
                const secretKey = Uint8Array.from(numbers);
                return Keypair.fromSecretKey(secretKey);
            }
        }
    } catch (err: any) {
        console.warn(`[getHotWalletKeypair] Regex attempt failed: ${err.message}`);
    }

    // 3. Fallback to parsing as raw JSON
    try {
        if (secretKeyString.startsWith("[")) {
            const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
            return Keypair.fromSecretKey(secretKey);
        }
    } catch (err) {
        // Ignore
    }

    // Capture first/last chars for debugging (masked)
    const debugStart = secretKeyString.substring(0, 5);
    const debugEnd = secretKeyString.substring(secretKeyString.length - 5);
    console.error(`[getHotWalletKeypair] FAILED. Len: ${secretKeyString.length}. Start: '${debugStart}', End: '${debugEnd}'. LastError: ${lastError}`);

    throw new Error(`Invalid Key Format. Len: ${secretKeyString.length}. Details: ${lastError || "Unknown format. Check Vercel vars."}`);
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
