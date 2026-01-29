const { Keypair, Connection, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// The CORRUPT array (64 bytes)
const corruptArray = [17, 107, 110, 56, 207, 225, 189, 167, 143, 126, 11, 211, 224, 104, 145, 11, 50, 158, 171, 15, 227, 205, 72, 77, 181, 23, 0, 59, 89, 176, 141, 220, 160, 36, 84, 117, 80, 63, 94, 228, 142, 20, 248, 39, 152, 143, 101, 135, 123, 198, 34, 100, 56, 243, 16, 149, 158, 2, 217, 192, 109, 103, 178, 89];

// RECIPIENT (User provided)
const DESTINATION = "2qzHXnRAv4zUTQkozqFfCAFjgMd4ngTkGEcu2LprDweC";

// RPC (Mainnet)
const CONNECTION = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

async function rescue() {
    console.log("=== ATTEMPTING RESCUE ===");

    // 1. Recover Keypair from SEED (first 32 bytes)
    const seed = Uint8Array.from(corruptArray.slice(0, 32));
    const wallet = Keypair.fromSeed(seed);

    console.log("RECOVERED WALLET:", wallet.publicKey.toBase58());

    // 2. Check Balance
    const balance = await CONNECTION.getBalance(wallet.publicKey);
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance === 0) {
        console.log("Wallet is empty. Nothing to rescue.");
        return;
    }

    // 3. Send Everything (-fees)
    const destPubkey = new PublicKey(DESTINATION);
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: destPubkey,
            lamports: balance - 5000, // Leave tiny dust for fee
        })
    );

    try {
        const signature = await CONNECTION.sendTransaction(transaction, [wallet]);
        console.log("TRANSACTION SENT!");
        console.log("Signature:", signature);
        await CONNECTION.confirmTransaction(signature, "confirmed");
        console.log("CONFIRMED! Funds rescued.");
    } catch (e) {
        console.error("TRANSFER FAILED:", e);
    }
}

rescue();
