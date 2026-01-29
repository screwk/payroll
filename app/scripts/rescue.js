const { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");

async function rescue() {
    const RPC_URL = "https://api.mainnet-beta.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");

    // The key provided by the user in the logs
    const secretKey = Uint8Array.from([164, 89, 67, 138, 87, 24, 188, 68, 168, 236, 221, 51, 24, 145, 159, 82, 211, 141, 163, 185, 179, 234, 96, 28, 161, 59, 2, 53, 177, 91, 4, 166, 87, 122, 16, 145, 159, 82, 211, 141, 163, 185, 179, 234, 96, 28, 161, 59, 2, 53, 177, 91, 4, 166, 87, 122, 16, 145, 178, 185, 48, 135, 184, 194, 59, 48, 246, 157, 147, 157, 155, 126, 183, 180, 67, 170, 193, 61, 35, 27, 37, 70, 22, 100, 213, 88]);

    // WAIT - I need to be careful with the array length. 
    // The user's image shows: [164, 89, 67, 138, 87, 24, 188, 68, 168, 236, 221, 51, 24, 145, 159, 82, 211, 141, 163, 185, 179, 234, 96, 28, 161, 59, 2, 53, 177, 91, 4, 166, 87, 122, 16, 145, 178, 185, 48, 135, 184, 194, 59, 48, 246, 157, 147, 157, 155, 126, 183, 180, 67, 170, 193, 61, 35, 27, 37, 70, 22, 100, 213, 88]
    // Let me re-verify the numbers from the screenshot carefully.

    const key = [164, 89, 67, 138, 87, 24, 188, 68, 168, 236, 221, 51, 24, 145, 159, 82, 211, 141, 163, 185, 179, 234, 96, 28, 161, 59, 2, 53, 177, 91, 4, 166, 87, 122, 16, 145, 178, 185, 48, 135, 184, 194, 59, 48, 246, 157, 147, 157, 155, 126, 183, 180, 67, 170, 193, 61, 35, 27, 37, 70, 22, 100, 213, 88];
    console.log("Key length:", key.length);

    const fromKeypair = Keypair.fromSecretKey(Uint8Array.from(key));
    const toPublicKey = new PublicKey("2qzHXnRAv4zUTQkozqFfCAFjgMd4ngTkGEcu2LprDweC");

    console.log("From:", fromKeypair.publicKey.toString());
    console.log("To:", toPublicKey.toString());

    const balance = await connection.getBalance(fromKeypair.publicKey);
    console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");

    if (balance === 0) {
        console.log("No balance to rescue.");
        return;
    }

    // Leave a small amount for rent/fees
    const amountToSend = balance - 5000;

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: amountToSend,
        })
    );

    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    console.log("Success! Signature:", signature);
}

rescue();
