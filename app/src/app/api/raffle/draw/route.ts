import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getRaffleById, getRaffleParticipants } from "@/lib/raffleStorage";
import { sendPrize } from "@/lib/serverWallet";
import { ADMIN_WALLETS } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, adminWallet } = await req.json();

        // 1. Authorization check
        if (!ADMIN_WALLETS.includes(adminWallet)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Fetch raffle data
        const raffle = await getRaffleById(raffleId);
        if (!raffle) {
            return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
        }

        if (raffle.status !== 'active') {
            return NextResponse.json({ error: "Raffle is not in active status" }, { status: 400 });
        }

        // 3. Fetch participants
        const participants = await getRaffleParticipants(raffleId);
        if (participants.length < 2) {
            return NextResponse.json({ error: "Not enough participants to draw (min 2)" }, { status: 400 });
        }

        // 4. Randomly pick a winner
        // Build an array of tickets
        const ticketPool: string[] = [];
        participants.forEach(p => {
            for (let i = 0; i < p.quantity; i++) {
                ticketPool.push(p.wallet);
            }
        });

        const randomIndex = Math.floor(Math.random() * ticketPool.length);
        const winnerWallet = ticketPool[randomIndex];

        // 5. Send prize from Hot Wallet
        let prizeTxSignature: string | null = null;
        try {
            prizeTxSignature = await sendPrize(winnerWallet, raffle.prizeAmount);
        } catch (err: any) {
            console.error("[Draw API] Payout error:", err);
            return NextResponse.json({ error: "Failed to send prize: " + err.message }, { status: 500 });
        }

        // 6. Update Database
        const { error: updateError } = await supabase
            .from('raffles')
            .update({
                status: 'pending_payout', // Entering 24h quarantine
                winner_wallet: winnerWallet,
                prize_tx_signature: prizeTxSignature,
                drawn_at: new Date().toISOString()
            })
            .eq('id', raffleId);

        if (updateError) {
            console.error("[Draw API] Database update error:", updateError);
            return NextResponse.json({ error: "Database update failed after payout" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            winner: winnerWallet,
            signature: prizeTxSignature
        });

    } catch (err: any) {
        console.error("[Draw API] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
