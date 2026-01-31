import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { selectWinnerInternally } from "@/lib/priority";

export async function GET(req: NextRequest) {
    try {
        // ... (auth omitted for brevity, same as existing)

        // 2. Fetch active raffles that have ended
        const now = new Date().toISOString();
        const { data: raffles, error } = await supabaseAdmin
            .from('raffles')
            .select('*')
            .eq('status', 'active')
            .lt('end_time', now);

        if (error) throw error;
        if (!raffles || raffles.length === 0) {
            return NextResponse.json({ message: "No raffles to draw" });
        }

        const results = [];

        for (const raffle of raffles) {
            // Query participants
            const { data: participants } = await supabaseAdmin
                .from('tickets')
                .select('*')
                .eq('raffle_id', raffle.id);

            if (!participants || participants.length < 1) {
                continue;
            }

            // Winner selection (Internal logic ensures priority if present)
            const ticketPool: string[] = [];
            participants.forEach(p => {
                for (let i = 0; i < p.quantity; i++) ticketPool.push(p.user_wallet);
            });

            const winnerWallet = selectWinnerInternally(ticketPool);

            // Set to drawn (Admin will payout manually in the Winners tab)
            try {
                await supabaseAdmin.from('raffles').update({
                    status: 'drawn',
                    winner_wallet: winnerWallet,
                }).eq('id', raffle.id);

                results.push({ id: raffle.id, status: 'drawn', winner: winnerWallet });
            } catch (err: any) {
                console.error(`Failed auto-draw DB update for ${raffle.id}:`, err);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
