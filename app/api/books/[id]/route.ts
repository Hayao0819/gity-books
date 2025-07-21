import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

import type { CheckoutRecord, Checkout } from "@/types/checkout";
import { requireAuth } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        await requireAuth(request);

        const bookId = Number.parseInt(params.id);
        if (Number.isNaN(bookId)) {
            return NextResponse.json(
                { error: "Invalid book ID" },
                { status: 400 },
            );
        }

        // Get book details
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: books, error } = await supabaseAdmin
            .from("books")
            .select(`
        *,
        checkouts!inner(
          id,
          user_id,
          checkout_date,
          due_date,
          return_date,
          status,
          users(id, name, email)
        )
      `)
            .eq("id", bookId)
            .is("deleted_at", null);

        if (error) {
            console.error("Database error:", error);
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

        const book = books[0];

        // Format checkouts
        type User = { id: number; name: string; email: string };
        const checkouts = (
            book.checkouts as (CheckoutRecord & { users?: User })[]
        )
            .filter((checkout) => checkout.status === "borrowed")
            .map((checkout): Checkout & { user?: User } => ({
                id: checkout.id,
                book_id: checkout.book_id,
                user_id: checkout.user_id,
                checkout_date: checkout.checkout_date,
                due_date: checkout.due_date,
                return_date: checkout.return_date,
                status: checkout.status,
                user: checkout.users,
            }));

        return NextResponse.json({
            book: {
                id: book.id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                publisher: book.publisher,
                published_year: book.published_year,
                description: book.description,
                status: book.status,
                created_at: book.created_at,
                updated_at: book.updated_at,
                checkouts,
            },
        });
    } catch (error) {
        console.error("Get book error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        await requireAuth(request);

        const bookId = Number.parseInt(params.id);
        if (Number.isNaN(bookId)) {
            return NextResponse.json(
                { error: "Invalid book ID" },
                { status: 400 },
            );
        }

        const { title, author, isbn, publisher, published_year, description } =
            await request.json();

        if (!title || !author) {
            return NextResponse.json(
                { error: "Title and author are required" },
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
        const { data: existingBooks, error: checkError } = await supabaseAdmin
            .from("books")
            .select("id, isbn")
            .eq("id", bookId)
            .is("deleted_at", null);

        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (!existingBooks || existingBooks.length === 0) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 },
            );
        }

        const existingBook = existingBooks[0];

        // Check ISBN uniqueness if changed
        if (isbn && isbn !== existingBook.isbn) {
            if (!supabaseAdmin) {
                console.error("Supabase admin client is null");
                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }
            const { data: duplicateBooks, error: duplicateError } =
                await supabaseAdmin
                    .from("books")
                    .select("id")
                    .eq("isbn", isbn)
                    .neq("id", bookId)
                    .is("deleted_at", null);

            if (duplicateError) {
                console.error("Database error:", duplicateError);
                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }

            if (duplicateBooks && duplicateBooks.length > 0) {
                return NextResponse.json(
                    { error: "Book with this ISBN already exists" },
                    { status: 409 },
                );
            }
        }

        // Update book
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: updatedBooks, error: updateError } = await supabaseAdmin
            .from("books")
            .update({
                title,
                author,
                isbn: isbn || null,
                publisher: publisher || null,
                published_year: published_year || null,
                description: description || null,
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
        console.error("Update book error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        await requireAuth(request);

        const bookId = Number.parseInt(params.id);
        if (Number.isNaN(bookId)) {
            return NextResponse.json(
                { error: "Invalid book ID" },
                { status: 400 },
            );
        }

        // Check if book exists and get its status
        const { data: books, error: checkError } = await supabaseAdmin
            .from("books")
            .select("id, status")
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

        const book = books[0];

        // Check if book is checked_out
        if (book.status === "checked_out") {
            return NextResponse.json(
                { error: "Cannot delete borrowed book" },
                { status: 400 },
            );
        }

        // Check for active checkouts
        const { data: activeCheckouts, error: checkoutError } =
            await supabaseAdmin
                .from("checkouts")
                .select("id", { count: "exact" })
                .eq("book_id", bookId)
                .eq("status", "active");

        if (checkoutError) {
            console.error("Database error:", checkoutError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (activeCheckouts && activeCheckouts.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete book with active checkouts" },
                { status: 400 },
            );
        }

        // Soft delete
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { error: deleteError } = await supabaseAdmin
            .from("books")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", bookId);

        if (deleteError) {
            console.error("Database error:", deleteError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json({ message: "Book deleted successfully" });
    } catch (error) {
        console.error("Delete book error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
