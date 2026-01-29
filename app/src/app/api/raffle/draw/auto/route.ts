import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPrize } from "@/lib/serverWallet";

export async function GET(req: NextRequest) {
    try {
        // 1. Cron Auth (Simple check for Vercel Cron header or internal secret)
        // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new Response('Unauthorized', { status: 401 });
        // }

        // 2. Fetch active raffles that have ended
        const now = new Date().toISOString();
        const { data: raffles, error } = await supabase
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
            const { data: participants } = await supabase
                .from('tickets')
                .select('*')
                .eq('raffle_id', raffle.id);

            if (!participants || participants.length < 2) {
                // Handle refund or cancellation logic if needed
                // For now, just skip or mark as awaiting more buyers (extension logic could go here)
                continue;
            }

            // Random winner
            const ticketPool: string[] = [];
            participants.forEach(p => {
                for (let i = 0; i < p.quantity; i++) ticketPool.push(p.user_wallet);
            });

            const winnerWallet = ticketPool[Math.floor(Math.random() * ticketPool.length)];

            // Payout Prize
            try {
                const signature = await sendPrize(winnerWallet, raffle.prize_amount);

                await supabase.from('raffles').update({
                    status: 'pending_payout',
                    winner_wallet: winnerWallet,
                    prize_tx_signature: signature,
                    drawn_at: new Date().toISOString()
                }).eq('id', raffle.id);

                results.push({ id: raffle.id, status: 'drawn', winner: winnerWallet });
            } catch (err: any) {
                console.error(`Failed auto-draw for ${raffle.id}:`, err);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
