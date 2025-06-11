import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        requireAuth(request);

        // Get total books
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: totalBooks, error: totalBooksError } =
            await supabaseAdmin
                .from("books")
                .select("*", { count: "exact", head: true })
                .is("deleted_at", null);

        if (totalBooksError) {
            console.error("Database error:", totalBooksError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get available books
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: availableBooks, error: availableBooksError } =
            await supabaseAdmin
                .from("books")
                .select("*", { count: "exact", head: true })
                .eq("status", "available")
                .is("deleted_at", null);

        if (availableBooksError) {
            console.error("Database error:", availableBooksError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get borrowed books
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: borrowedBooks, error: borrowedBooksError } =
            await supabaseAdmin
                .from("books")
                .select("*", { count: "exact", head: true })
                .eq("status", "borrowed")
                .is("deleted_at", null);

        if (borrowedBooksError) {
            console.error("Database error:", borrowedBooksError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get monthly checkouts (current month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: monthlyCheckouts, error: monthlyCheckoutsError } =
            await supabaseAdmin
                .from("checkouts")
                .select("*", { count: "exact", head: true })
                .gte("borrowed_date", startOfMonth.toISOString())
                .is("deleted_at", null);

        if (monthlyCheckoutsError) {
            console.error("Database error:", monthlyCheckoutsError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get overdue books
        const { count: overdueBooks, error: overdueBooksError } =
            await supabaseAdmin
                .from("checkouts")
                .select("*", { count: "exact", head: true })
                .eq("status", "borrowed")
                .lt("due_date", new Date().toISOString())
                .is("deleted_at", null);

        if (overdueBooksError) {
            console.error("Database error:", overdueBooksError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get total users
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { count: totalUsers, error: totalUsersError } =
            await supabaseAdmin
                .from("users")
                .select("*", { count: "exact", head: true })
                .is("deleted_at", null);

        if (totalUsersError) {
            console.error("Database error:", totalUsersError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            total_books: totalBooks || 0,
            available_books: availableBooks || 0,
            borrowed_books: borrowedBooks || 0,
            monthly_checkouts: monthlyCheckouts || 0,
            overdue_books: overdueBooks || 0,
            total_users: totalUsers || 0,
        });
    } catch (error) {
        console.error("Get stats overview error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
