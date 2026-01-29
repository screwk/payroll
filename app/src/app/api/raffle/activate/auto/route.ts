import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT, HOT_WALLET } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch raffles waiting for deposit confirmation
        const { data: raffles, error } = await supabase
            .from('raffles')
            .select('*')
            .eq('status', 'waiting_deposit')
            .not('deposit_tx_signature', 'is', null);

        if (error) throw error;
        if (!raffles || raffles.length === 0) {
            return NextResponse.json({ message: "No pending deposits to verify" });
        }

        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const results = [];

        for (const raffle of raffles) {
            try {
                const signature = raffle.deposit_tx_signature;
                console.log(`[Verify] Checking signature for raffle ${raffle.id}: ${signature}`);

                // Fetch transaction details
                const tx = await connection.getParsedTransaction(signature, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 0
                });

                if (!tx) {
                    console.log(`[Verify] Transaction not found for ${raffle.id}. Wait longer?`);
                    results.push({ id: raffle.id, status: 'not_found' });
                    continue;
                }

                // Check for errors
                if (tx.meta?.err) {
                    console.log(`[Verify] Transaction failed for ${raffle.id}`);
                    results.push({ id: raffle.id, status: 'failed_tx' });
                    continue;
                }

                // Verify recipient and amount
                // We look through accountKeys and balances to confirm HOT_WALLET received the funds
                const accountIndex = tx.transaction.message.accountKeys.findIndex(
                    ak => ak.pubkey.toString() === HOT_WALLET
                );

                if (accountIndex === -1) {
                    console.log(`[Verify] HOT_WALLET not found in transaction accounts for ${raffle.id}`);
                    results.push({ id: raffle.id, status: 'wrong_recipient' });
                    continue;
                }

                const preBalance = tx.meta?.preBalances[accountIndex] || 0;
                const postBalance = tx.meta?.postBalances[accountIndex] || 0;
                const receivedAmount = (postBalance - preBalance) / LAMPORTS_PER_SOL;

                // Precision check (allow small variance for decimal math)
                if (receivedAmount < (raffle.prize_amount * 0.999)) {
                    console.log(`[Verify] Amount mismatch for ${raffle.id}. Expected ${raffle.prize_amount}, Got ${receivedAmount}`);
                    results.push({ id: raffle.id, status: 'amount_mismatch', received: receivedAmount });
                    continue;
                }

                // SUCCESS: Activate Raffle
                const { error: updateError } = await supabase
                    .from('raffles')
                    .update({
                        status: 'active',
                        activated_at: new Date().toISOString()
                    })
                    .eq('id', raffle.id);

                if (updateError) throw updateError;

                console.log(`[Verify] SUCCESS: Activated raffle ${raffle.id}`);
                results.push({ id: raffle.id, status: 'activated', signature });

            } catch (err: any) {
                console.error(`[Verify] Error processing raffle ${raffle.id}:`, err);
                results.push({ id: raffle.id, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error("[Verify API] Fatal error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
