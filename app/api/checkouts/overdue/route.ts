export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import type { CheckoutWithUserAndBook } from "@/types/checkout";
import { transformCheckoutWithUserAndBook } from "@/lib/utils/checkout-transform";

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);

        const { searchParams } = new URL(request.url);
        const page = Number.parseInt(searchParams.get("page") || "1");
        const limit = Math.min(
            Number.parseInt(searchParams.get("limit") || "10"),
            100,
        );
        const offset = (page - 1) * limit;

        // Get overdue checkouts with book and user details
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const {
            data: checkouts,
            error,
            count,
        } = await supabaseAdmin
            .from("checkouts")
            .select(
                `
        *,
        books(id, title, author, isbn),
        users(id, name, email, student_id)
      `,
                { count: "exact" },
            )
            .eq("status", "active")
            .lt("due_date", new Date().toISOString())
            .is("deleted_at", null)
            .order("due_date", { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        const formattedCheckouts: CheckoutWithUserAndBook[] = (
            checkouts || []
        ).map(transformCheckoutWithUserAndBook);

        return NextResponse.json({
            checkouts: formattedCheckouts,
            pagination: {
                total: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Get overdue checkouts error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
