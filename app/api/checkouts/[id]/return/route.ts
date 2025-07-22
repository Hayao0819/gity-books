import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        requireAuth(request);

        const checkoutId = Number.parseInt(params.id);
        if (Number.isNaN(checkoutId)) {
            return NextResponse.json(
                { error: "Invalid checkout ID" },
                { status: 400 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const returnDate = body.return_date
            ? new Date(body.return_date)
            : new Date();

        // Check if checkout exists and is active
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: checkouts, error: checkError } = await supabaseAdmin
            .from("checkouts")
            .select("id, book_id, status")
            .eq("id", checkoutId)
            .eq("status", "borrowed")
            .is("deleted_at", null);

        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (!checkouts || checkouts.length === 0) {
            return NextResponse.json(
                { error: "Active checkout not found" },
                { status: 404 },
            );
        }

        // 返却処理: checkouts.status更新 & books.statusもavailableへ
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        // 1. checkoutsテーブル更新
        const { data: _, error: returnError } = await supabaseAdmin
            .from("checkouts")
            .update({
                status: "returned",
                return_date: returnDate.toISOString(),
            })
            .eq("id", checkoutId);

        if (returnError) {
            console.error("Return error:", returnError);
            return NextResponse.json(
                { error: "Failed to return book" },
                { status: 500 },
            );
        }

        // 2. booksテーブル更新
        const bookId = checkouts[0].book_id;
        const { error: bookUpdateError } = await supabaseAdmin
            .from("books")
            .update({
                status: "available",
                updated_at: new Date().toISOString(),
            })
            .eq("id", bookId);
        if (bookUpdateError) {
            console.error("Book status update error:", bookUpdateError);
            return NextResponse.json(
                { error: "Failed to update book status" },
                { status: 500 },
            );
        }

        // Get checkout with details
        const { data: checkoutDetails, error: detailsError } =
            await supabaseAdmin
                .from("checkouts")
                .select(`
        *,
        books(id, title, author, isbn),
        users(id, name, email)
      `)
                .eq("id", checkoutId)
                .single();

        if (detailsError) {
            console.error("Database error:", detailsError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            checkout: {
                id: checkoutDetails.id,
                book_id: checkoutDetails.book_id,
                user_id: checkoutDetails.user_id,
                due_date: checkoutDetails.due_date,
                return_date: checkoutDetails.return_date,
                status: checkoutDetails.status,
                created_at: checkoutDetails.created_at,
                updated_at: checkoutDetails.updated_at,
                book: checkoutDetails.books,
                user: checkoutDetails.users,
            },
        });
    } catch (error) {
        console.error("Return book error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
