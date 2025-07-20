import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        requireAuth(request);

        const { searchParams } = new URL(request.url);
        const limit = Math.min(
            Number.parseInt(searchParams.get("limit") || "10"),
            50,
        );

        // Get popular books using a join query
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: popularBooks, error } = await supabaseAdmin
            .from("books")
            .select(
                `
        id,
        title,
        author,
        checkouts!inner(id)
      `,
            )
            .is("deleted_at", null)
            .limit(limit);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Process the data to count checkouts
        type BookWithCheckouts = {
            id: number;
            title: string;
            author: string;
            checkouts: { id: number }[];
        };
        const booksWithCounts = (popularBooks || []).map(
            (book: BookWithCheckouts) => ({
                id: book.id,
                title: book.title,
                author: book.author,
                checkout_count: book.checkouts?.length || 0,
            }),
        );

        // Sort by checkout count
        booksWithCounts.sort((a, b) => b.checkout_count - a.checkout_count);

        return NextResponse.json({ books: booksWithCounts.slice(0, limit) });
    } catch (error) {
        console.error("Get popular books error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
