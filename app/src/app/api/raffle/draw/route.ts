import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPrize } from "@/lib/serverWallet";
import { ADMIN_WALLETS } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, adminWallet } = await req.json();

        // 1. Authorization check
        if (!ADMIN_WALLETS.includes(adminWallet)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Fetch raffle data using supabaseAdmin (bypass RLS)
        const { data: raffle, error: raffleError } = await supabaseAdmin
            .from('raffles')
            .select('*')
            .eq('id', raffleId)
            .single();

        if (raffleError || !raffle) {
            return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
        }

        if (raffle.status !== 'active') {
            return NextResponse.json({ error: "Raffle is not in active status" }, { status: 400 });
        }

        // 3. Fetch participants using supabaseAdmin (bypass RLS)
        const { data: participants, error: partError } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('raffle_id', raffleId);

        if (partError || !participants) {
            return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
        }

        if (participants.length < 1) {
            console.error(`[Draw API] No participants found for raffle ${raffleId}.`);
            return NextResponse.json({
                error: "Zero participants. No one to draw from.",
                code: "EMPTY_RAFFLE"
            }, { status: 400 });
        }

        // 4. Randomly pick a winner
        const ticketPool: string[] = [];
        participants.forEach(p => {
            for (let i = 0; i < p.quantity; i++) {
                ticketPool.push(p.user_wallet);
            }
        });

        const randomIndex = Math.floor(Math.random() * ticketPool.length);
        const winnerWallet = ticketPool[randomIndex];

        // 5. Update Database using supabaseAdmin (Set to 'drawn', admin will pay later)
        const { error: updateError } = await supabaseAdmin
            .from('raffles')
            .update({
                status: 'drawn',
                winner_wallet: winnerWallet
            })
            .eq('id', raffleId);

        if (updateError) {
            console.error("[Draw API] Database update error:", updateError);
            return NextResponse.json({ error: "Database update failed after picking winner" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            winner: winnerWallet
        });

    } catch (err: any) {
        console.error("[Draw API] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
