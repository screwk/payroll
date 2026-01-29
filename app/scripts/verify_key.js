const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// User Provided Data
const USER_SECRET = "3dSzqw729JFQ3qsYxKkhGezYAW5SQiKkmxGw3gW4adjdfrUEXt1MJj7E4zsfpyGyiR49yPP5PNVAm1VrDthBJ4GK";
const USER_PUBLIC = "2fmjVoPUUn52nkGp7Z8aCsamFJVmkdMtQ1w6NSM7EBg7";

// Handle bs58 lookup
const decode = bs58.decode || bs58.default?.decode;

try {
    const decoded = decode(USER_SECRET);
    const kp = Keypair.fromSecretKey(decoded);
    const derivedPublic = kp.publicKey.toBase58();

    console.log("=== KEY VERIFICATION ===");
    console.log(`PROVIDED PUBLIC: ${USER_PUBLIC}`);
    console.log(`DERIVED PUBLIC:  ${derivedPublic}`);

    if (derivedPublic === USER_PUBLIC) {
        console.log("MATCH: ✅✅✅");
    } else {
        console.log("MATCH: ❌❌❌ (MISMATCH)");
    }
    console.log("========================");

} catch (e) {
    console.error("VERIFICATION FAILED:", e.message);
}
