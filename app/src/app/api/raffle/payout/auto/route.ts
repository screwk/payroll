import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPrize } from "@/lib/serverWallet";
import { PLATFORM_FEE_BPS } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        // 1. Cron Auth Check
        // ...

        // 2. Fetch raffles in quarantine (pending_payout) for at least 24 hours
        const quarantineTime = new Date();
        quarantineTime.setHours(quarantineTime.getHours() - 24);

        const { data: raffles, error } = await supabase
            .from('raffles')
            .select('*')
            .eq('status', 'pending_payout')
            .lt('drawn_at', quarantineTime.toISOString());

        if (error) throw error;
        if (!raffles || raffles.length === 0) {
            return NextResponse.json({ message: "No payouts pending quarantine" });
        }

        const results = [];

        for (const raffle of raffles) {
            const grossRevenue = raffle.total_revenue || 0;
            const platformFee = (grossRevenue * PLATFORM_FEE_BPS) / 10000;
            const payoutAmount = grossRevenue - platformFee;

            try {
                let signature = "NO_REVENUE";
                if (payoutAmount > 0) {
                    signature = await sendPrize(raffle.creator_wallet, payoutAmount);
                }

                await supabase.from('raffles').update({
                    status: 'completed',
                    payout_tx_signature: signature
                }).eq('id', raffle.id);

                results.push({ id: raffle.id, status: 'completed', payout: payoutAmount });
            } catch (err: any) {
                console.error(`Failed auto-payout for ${raffle.id}:`, err);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
