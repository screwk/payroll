import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_WALLETS } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const { raffleId, adminWallet } = await req.json();

        // 1. Basic Authorization Check
        if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet)) {
            return NextResponse.json({ error: "Unauthorized: Wallet not in admin list" }, { status: 401 });
        }

        // 2. Initialize Supabase with Service Role (Bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("[API Delete] Missing Supabase Service Role configuration");
            return NextResponse.json({ error: "Server configuration error: Missing Service Role Key" }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log(`[API Delete] Admin ${adminWallet} is deleting raffle ${raffleId}`);

        // 3. Delete Participants first
        const { error: partError, count: partCount } = await supabaseAdmin
            .from('participants')
            .delete({ count: 'exact' })
            .eq('raffle_id', raffleId);

        if (partError) {
            console.error("[API Delete] Error clearing participants:", partError);
            return NextResponse.json({ error: `Failed to clear participants: ${partError.message}` }, { status: 500 });
        }

        // 4. Delete Raffle
        const { error: raffleError, count: raffleCount } = await supabaseAdmin
            .from('raffles')
            .delete({ count: 'exact' })
            .eq('id', raffleId);

        if (raffleError) {
            console.error("[API Delete] Error deleting raffle:", raffleError);
            return NextResponse.json({ error: `Failed to delete raffle: ${raffleError.message}` }, { status: 500 });
        }

        if (raffleCount === 0) {
            return NextResponse.json({ error: "Raffle not found in database", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Successfully deleted raffle and ${partCount || 0} participants` });

    } catch (error: any) {
        console.error("[API Delete] Unexpected error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
