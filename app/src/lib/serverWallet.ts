import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./config";

/**
 * Server-side utility to interact with the Hot Wallet
 */
export const getHotWalletKeypair = () => {
    const secretKeyString = process.env.PAYROLL_SECRET_KEY;
    if (!secretKeyString) {
        throw new Error("PAYROLL_SECRET_KEY not found in environment variables");
    }

    try {
        // Expecting a JSON array string like "[1,2,3...]"
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        return Keypair.fromSecretKey(secretKey);
    } catch (err) {
        throw new Error("Invalid PAYROLL_SECRET_KEY format. Expected a JSON array of numbers.");
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
