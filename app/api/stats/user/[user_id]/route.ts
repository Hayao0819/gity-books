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
        if (Number.isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }

        // Get total checkouts
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: totalCheckouts, error: totalError } = await supabaseAdmin
            .from("checkouts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .is("deleted_at", null);

        if (totalError) {
            console.error("Database error:", totalError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get active checkouts
        const { count: activeCheckouts, error: activeError } =
            await supabaseAdmin
                .from("checkouts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "active")
                .is("deleted_at", null);

        if (activeError) {
            console.error("Database error:", activeError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get overdue checkouts
        const { count: overdueCheckouts, error: overdueError } =
            await supabaseAdmin
                .from("checkouts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "active")
                .lt("due_date", new Date().toISOString())
                .is("deleted_at", null);

        if (overdueError) {
            console.error("Database error:", overdueError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get returned books
        const { count: returnedBooks, error: returnedError } =
            await supabaseAdmin
                .from("checkouts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "returned")
                .is("deleted_at", null);

        if (returnedError) {
            console.error("Database error:", returnedError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            total_checkouts: totalCheckouts || 0,
            active_checkouts: activeCheckouts || 0,
            overdue_checkouts: overdueCheckouts || 0,
            returned_books: returnedBooks || 0,
        });
    } catch (error) {
        console.error("Get user stats error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
