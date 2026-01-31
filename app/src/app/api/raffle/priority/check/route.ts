import { NextRequest, NextResponse } from "next/server";
import { isPriorityWallet } from "@/lib/priority";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ isPriority: false });
    }

    return NextResponse.json({ isPriority: isPriorityWallet(wallet) });
}
