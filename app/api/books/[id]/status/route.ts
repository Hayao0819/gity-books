import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        requireAuth(request);

        const bookId = Number.parseInt(params.id);
        if (Number.isNaN(bookId)) {
            return NextResponse.json(
                { error: "Invalid book ID" },
                { status: 400 },
            );
        }

        const { status } = await request.json();

        if (!status || !["available", "borrowed"].includes(status)) {
            return NextResponse.json(
                {
                    error: "Invalid status. Must be available or borrowed",
                },
                { status: 400 },
            );
        }

        // Check if book exists
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: books, error: checkError } = await supabaseAdmin
            .from("books")
            .select("id")
            .eq("id", bookId)
            .is("deleted_at", null);

        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (!books || books.length === 0) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 },
            );
        }

        // Update status
        const { data: updatedBooks, error: updateError } = await supabaseAdmin
            .from("books")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", bookId)
            .select(
                "id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at",
            );

        if (updateError) {
            console.error("Database error:", updateError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        const book = updatedBooks[0];

        return NextResponse.json({ book });
    } catch (error) {
        console.error("Update book status error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
