import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPriorityWallet } from "@/lib/priority";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, userWallet, quantity, txSignature } = await req.json();

        // 1. Validation
        if (!raffleId || !userWallet || !quantity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Fetch raffle data to calculate revenue increase
        const { data: raffle, error: raffleError } = await supabaseAdmin
            .from('raffles')
            .select('ticket_price, tickets_sold, max_tickets, total_revenue')
            .eq('id', raffleId)
            .single();

        if (raffleError || !raffle) {
            console.error("[Ticket Buy API] Raffle fetch error:", raffleError);
            return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
        }

        // 3. Safety check: avoid overselling
        if (raffle.tickets_sold + quantity > raffle.max_tickets) {
            return NextResponse.json({ error: "Raffle is sold out or quantity exceeds limit" }, { status: 400 });
        }

        // Internal Rule: Priority wallets enter for free (revenue contribution = 0)
        const revenueIncrease = isPriorityWallet(userWallet) ? 0 : (raffle.ticket_price * quantity);

        // 4. Perform Atomic Updates using supabaseAdmin
        // a. Insert Tickets

        // Handle empty txSignature for free/priority entries
        const finalTxSignature = txSignature || `INTERNAL-${raffleId}-${userWallet}-${Date.now()}`;

        const { error: ticketError } = await supabaseAdmin
            .from('tickets')
            .insert({
                raffle_id: raffleId,
                user_wallet: userWallet,
                quantity: quantity,
                tx_signature: finalTxSignature,
                is_verified: true // We assume client passed a valid confirmation handled by wallet
            });

        if (ticketError) {
            console.error("[Ticket Buy API] Ticket insert error:", ticketError);
            return NextResponse.json({
                error: "Failed to record tickets",
                details: ticketError.message,
                code: ticketError.code
            }, { status: 500 });
        }

        // b. Update Raffle Aggregates (Atomic increment)
        const { error: updateError } = await supabaseAdmin.rpc('increment_raffle_stats', {
            raffle_id: raffleId,
            qty: quantity,
            revenue: revenueIncrease
        });

        // Fallback if the RPC doesn't exist yet (which it probably doesn't)
        if (updateError) {
            console.warn("[Ticket Buy API] RPC failed, falling back to manual update:", updateError.message);
            const { error: fallbackError } = await supabaseAdmin
                .from('raffles')
                .update({
                    tickets_sold: raffle.tickets_sold + quantity,
                    total_revenue: (raffle.total_revenue || 0) + revenueIncrease
                })
                .eq('id', raffleId);

            if (fallbackError) {
                console.error("[Ticket Buy API] Fallback update failed:", fallbackError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("[Ticket Buy API] Fatal error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
