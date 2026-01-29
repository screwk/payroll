const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Handle bs58 import mess
const encode = bs58.encode || bs58.default?.encode;

try {
    const kp = Keypair.generate();
    const secret = encode(kp.secretKey);
    const pub = kp.publicKey.toBase58();

    console.log("=== KEY GENERATED SUCCESSFULLY ===");
    console.log(`PUBLIC: ${pub}`);
    console.log(`SECRET: ${secret}`);
    console.log("==================================");
} catch (e) {
    console.error("GENERATION FAILED:", e);
}
