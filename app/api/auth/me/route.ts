import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
