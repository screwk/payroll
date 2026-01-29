import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RPC_ENDPOINT, HOT_WALLET } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        console.log("[Verify API] Starting sync process...");
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const results = [];

        // --- PART 1: VERIFY DEPOSITS ---
        const { data: pendingRaffles, error: fetchError } = await supabaseAdmin
            .from('raffles')
            .select('*')
            .eq('status', 'waiting_deposit')
            .not('deposit_tx_signature', 'is', null);

        if (fetchError) {
            console.error("[Verify API] Fetch error:", fetchError);
            throw fetchError;
        }

        if (pendingRaffles && pendingRaffles.length > 0) {
            console.log(`[Verify API] Found ${pendingRaffles.length} raffles to check for deposit.`);
            for (const raffle of pendingRaffles) {
                try {
                    const signature = raffle.deposit_tx_signature;
                    const tx = await connection.getParsedTransaction(signature, {
                        commitment: "confirmed",
                        maxSupportedTransactionVersion: 0
                    });

                    if (!tx || tx.meta?.err) {
                        results.push({ id: raffle.id, status: 'failed_tx' });
                        continue;
                    }

                    const accountIndex = tx.transaction.message.accountKeys.findIndex(
                        ak => ak.pubkey.toString() === HOT_WALLET
                    );

                    if (accountIndex === -1) {
                        results.push({ id: raffle.id, status: 'wrong_recipient' });
                        continue;
                    }

                    const preBalance = tx.meta?.preBalances[accountIndex] || 0;
                    const postBalance = tx.meta?.postBalances[accountIndex] || 0;
                    const receivedAmount = (postBalance - preBalance) / LAMPORTS_PER_SOL;

                    if (receivedAmount >= (raffle.prize_amount * 0.999)) {
                        await supabaseAdmin
                            .from('raffles')
                            .update({ status: 'active' })
                            .eq('id', raffle.id);
                        results.push({ id: raffle.id, status: 'activated', signature });
                    }
                } catch (err: any) {
                    results.push({ id: raffle.id, status: 'error', error: err.message });
                }
            }
        }

        // --- PART 2: REPAIR TICKET COUNTS ---
        // We do this for all ACTIVE raffles to ensure the Home page is correct
        console.log("[Verify API] Repairing ticket counts...");
        const { data: activeRaffles } = await supabaseAdmin
            .from('raffles')
            .select('id, ticket_price')
            .eq('status', 'active');

        if (activeRaffles) {
            for (const raffle of activeRaffles) {
                const { data: tickets } = await supabaseAdmin
                    .from('tickets')
                    .select('quantity')
                    .eq('raffle_id', raffle.id);

                if (tickets) {
                    const totalSold = tickets.reduce((sum, t) => sum + t.quantity, 0);
                    const totalRevenue = totalSold * raffle.ticket_price;

                    await supabaseAdmin
                        .from('raffles')
                        .update({
                            tickets_sold: totalSold,
                            total_revenue: totalRevenue
                        })
                        .eq('id', raffle.id);

                    console.log(`[Repair] Raffle ${raffle.id}: ${totalSold} tickets.`);
                }
            }
        }

        return NextResponse.json({ success: true, results, message: "Sync and Repair complete" });

    } catch (err: any) {
        console.error("[Verify API] Fatal crash:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
