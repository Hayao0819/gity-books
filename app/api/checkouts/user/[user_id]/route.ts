import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: { user_id: string } },
) {
    try {
        requireAuth(request);

        const userId = Number.parseInt(params.user_id);
        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const page = Number.parseInt(searchParams.get("page") || "1");
        const limit = Math.min(
            Number.parseInt(searchParams.get("limit") || "10"),
            100,
        );
        const offset = (page - 1) * limit;

        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        let query = supabaseAdmin
            .from("checkouts")
            .select(
                `
        *,
        books(id, title, author, isbn)
      `,
                { count: "exact" },
            )
            .eq("user_id", userId)
            .is("deleted_at", null);

        if (status) {
            query = query.eq("status", status);
        }

        const {
            data: checkouts,
            error,
            count,
        } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        const formattedCheckouts = (checkouts || []).map((checkout: any) => ({
            id: checkout.id,
            book_id: checkout.book_id,
            user_id: checkout.user_id,
            borrowed_date: checkout.borrowed_date,
            due_date: checkout.due_date,
            return_date: checkout.return_date,
            status: checkout.status,
            created_at: checkout.created_at,
            updated_at: checkout.updated_at,
            book: checkout.books,
        }));

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
        console.error("Get user checkouts error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
