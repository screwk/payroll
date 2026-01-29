import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getRaffleById } from "@/lib/raffleStorage";
import { sendPrize } from "@/lib/serverWallet";
import { OWNER_WALLET, PLATFORM_FEE_BPS } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, ownerWallet } = await req.json();

        // 1. Authorization check - Only OWNER can manually trigger
        // (Automated script would use a different bypass/secret)
        if (ownerWallet !== OWNER_WALLET) {
            return NextResponse.json({ error: "Unauthorized. Only Owner can trigger payouts." }, { status: 403 });
        }

        // 2. Fetch raffle data
        const raffle = await getRaffleById(raffleId);
        if (!raffle) {
            return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
        }

        if (raffle.status !== 'pending_payout') {
            return NextResponse.json({ error: "Raffle is not in pending_payout status" }, { status: 400 });
        }

        // 3. Calculate Payout
        // The Hot Wallet has the TOTAL_REVENUE (since prize was already sent)
        const grossRevenue = raffle.totalRevenue;
        const platformFee = (grossRevenue * PLATFORM_FEE_BPS) / 10000;
        const payoutAmount = grossRevenue - platformFee;

        // 4. Send Payout to Creator
        let payoutTxSignature: string | null = null;
        if (payoutAmount > 0) {
            try {
                payoutTxSignature = await sendPrize(raffle.creatorWallet, payoutAmount);
            } catch (err: any) {
                console.error("[Payout API] Payout error:", err);
                return NextResponse.json({ error: "Failed to send payout: " + err.message }, { status: 500 });
            }
        } else {
            payoutTxSignature = "NO_REVENUE";
        }

        // 5. Update Database
        const { error: updateError } = await supabaseAdmin
            .from('raffles')
            .update({
                status: 'completed',
                payout_tx_signature: payoutTxSignature
            })
            .eq('id', raffleId);

        if (updateError) {
            console.error("[Payout API] Database update error:", updateError);
            return NextResponse.json({ error: "Database update failed after payout" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            payoutAmount,
            signature: payoutTxSignature
        });

    } catch (err: any) {
        console.error("[Payout API] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
