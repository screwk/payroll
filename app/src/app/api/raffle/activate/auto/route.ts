import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT, HOT_WALLET } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        console.log("[Verify API] Starting sync process...");

        // 1. Fetch raffles waiting for deposit confirmation
        // We use supabaseAdmin to ensure we can see all raffles
        const { data: raffles, error } = await supabaseAdmin
            .from('raffles')
            .select('*')
            .eq('status', 'waiting_deposit')
            .not('deposit_tx_signature', 'is', null);

        if (error) {
            console.error("[Verify API] Fetch error:", error);
            throw error;
        }

        if (!raffles || raffles.length === 0) {
            console.log("[Verify API] No raffles awaiting deposit.");
            return NextResponse.json({ success: true, message: "No pending deposits to verify", results: [] });
        }

        console.log(`[Verify API] Found ${raffles.length} raffles to check.`);

        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const results = [];

        for (const raffle of raffles) {
            try {
                const signature = raffle.deposit_tx_signature;
                console.log(`[Verify] Checking raffle ${raffle.id} | Sig: ${signature}`);

                // Fetch transaction details
                const tx = await connection.getParsedTransaction(signature, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 0
                });

                if (!tx) {
                    console.log(`[Verify] Transaction not found for ${raffle.id}.`);
                    results.push({ id: raffle.id, status: 'not_found' });
                    continue;
                }

                // Check for errors
                if (tx.meta?.err) {
                    console.log(`[Verify] Transaction failed on-chain for ${raffle.id}`);
                    results.push({ id: raffle.id, status: 'failed_tx' });
                    continue;
                }

                // Verify recipient and amount
                const accountIndex = tx.transaction.message.accountKeys.findIndex(
                    ak => ak.pubkey.toString() === HOT_WALLET
                );

                if (accountIndex === -1) {
                    console.log(`[Verify] HOT_WALLET recipient mismatch for ${raffle.id}`);
                    results.push({ id: raffle.id, status: 'wrong_recipient' });
                    continue;
                }

                const preBalance = tx.meta?.preBalances[accountIndex] || 0;
                const postBalance = tx.meta?.postBalances[accountIndex] || 0;
                const receivedAmount = (postBalance - preBalance) / LAMPORTS_PER_SOL;

                // Threshold: allow 0.1% variance for lamport math
                const expectedAmount = raffle.prize_amount;
                if (receivedAmount < (expectedAmount * 0.999)) {
                    console.log(`[Verify] Amount too low for ${raffle.id}. Expected ${expectedAmount}, Got ${receivedAmount}`);
                    results.push({ id: raffle.id, status: 'amount_mismatch', received: receivedAmount, expected: expectedAmount });
                    continue;
                }

                // SUCCESS: Activate Raffle using ADMIN privileges
                const { error: updateError } = await supabaseAdmin
                    .from('raffles')
                    .update({
                        status: 'active'
                    })
                    .eq('id', raffle.id);

                if (updateError) {
                    console.error(`[Verify] Activation DB error for ${raffle.id}:`, updateError);
                    throw updateError;
                }

                console.log(`[Verify] SUCCESS: Raffle ${raffle.id} is now ACTIVE.`);
                results.push({ id: raffle.id, status: 'activated', signature });

            } catch (err: any) {
                console.error(`[Verify] Critical loop error for ${raffle.id}:`, err);
                results.push({ id: raffle.id, status: 'error', error: err.message || String(err) });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error("[Verify API] Fatal crash:", err);
        return NextResponse.json({
            success: false,
            error: err.message || String(err),
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
