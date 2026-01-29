import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ADMIN_WALLETS } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, adminWallet } = await req.json();

        // 1. Authorization check
        if (!ADMIN_WALLETS.includes(adminWallet)) {
            console.error(`[Force Activate] Unauthorized attempt from ${adminWallet}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        console.log(`[Force Activate] Manual activation request for raffle ${raffleId} by ${adminWallet}`);

        // 2. Perform Activation using ADMIN privileges
        const { error: updateError } = await supabaseAdmin
            .from('raffles')
            .update({
                status: 'active',
                activated_at: new Date().toISOString()
            })
            .eq('id', raffleId);

        if (updateError) {
            console.error(`[Force Activate] Database update failed for ${raffleId}:`, updateError);
            return NextResponse.json({ error: "Database update failed: " + updateError.message }, { status: 500 });
        }

        console.log(`[Force Activate] SUCCESS: Raffle ${raffleId} forced to ACTIVE.`);
        return NextResponse.json({ success: true, message: "Raffle activated successfully." });

    } catch (err: any) {
        console.error("[Force Activate] Fatal crash:", err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
