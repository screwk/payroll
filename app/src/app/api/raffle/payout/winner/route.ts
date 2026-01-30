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

        if (raffle.status !== 'drawn') {
            return NextResponse.json({ error: "Raffle status must be 'drawn' to payout winner" }, { status: 400 });
        }

        if (!raffle.winner_wallet) {
            return NextResponse.json({ error: "No winner found for this raffle" }, { status: 400 });
        }

        // 3. Send prize from Hot Wallet
        let prizeTxSignature: string | null = null;
        try {
            prizeTxSignature = await sendPrize(raffle.winner_wallet, raffle.prize_amount);
        } catch (err: any) {
            console.error("[Winner Payout API] Payout error:", err);
            return NextResponse.json({ error: "Failed to send prize: " + err.message }, { status: 500 });
        }

        // 4. Update Database: Set status to 'pending_payout' (revenue still due to creator)
        const { error: updateError } = await supabaseAdmin
            .from('raffles')
            .update({
                status: 'pending_payout',
                prize_tx_signature: prizeTxSignature
            })
            .eq('id', raffleId);

        if (updateError) {
            console.error("[Winner Payout API] Database update error:", updateError);
            // This is a dangerous state: prize sent but DB not updated.
            return NextResponse.json({
                error: "PRIZE SENT BUT DATABASE UPDATE FAILED",
                signature: prizeTxSignature
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            signature: prizeTxSignature
        });

    } catch (err: any) {
        console.error("[Winner Payout API] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
