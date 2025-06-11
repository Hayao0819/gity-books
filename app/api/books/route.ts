import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { optionalAuth, requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                {
                    error: "Database not configured. Please check environment variables.",
                },
                { status: 503 },
            );
        }

        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: "Database client not available" },
                { status: 503 },
            );
        }

        // Optional authentication for reading books
        const user = await optionalAuth(request);
        console.log("User authenticated:", user ? user.email : "No user");

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const page = Number.parseInt(searchParams.get("page") || "1");
        const limit = Math.min(
            Number.parseInt(searchParams.get("limit") || "10"),
            100,
        );
        const offset = (page - 1) * limit;

        console.log("Query params:", { search, status, page, limit, offset });

        // Test connection first
        const { error: connectionError } = await supabaseAdmin
            .from("books")
            .select("count", { count: "exact", head: true });

        if (connectionError) {
            console.error("Database connection error:", connectionError);
            return NextResponse.json(
                {
                    error: "Database connection failed",
                    details: connectionError.message,
                },
                { status: 500 },
            );
        }

        let query = supabaseAdmin
            .from("books")
            .select(
                "id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at",
                {
                    count: "exact",
                },
            )
            .is("deleted_at", null);

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`,
            );
        }

        if (status) {
            query = query.eq("status", status);
        }

        const {
            data: books,
            error,
            count,
        } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Database query error:", error);
            return NextResponse.json(
                {
                    error: "Database query failed",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        console.log("Books fetched successfully:", books?.length || 0);

        return NextResponse.json({
            books: books || [],
            pagination: {
                total: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Get books error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!isSupabaseConfigured() || !supabaseAdmin) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 503 },
            );
        }

        const user = await requireAuth(request);
        const { title, author, isbn, publisher, published_year, description } =
            await request.json();

        if (!title || !author) {
            return NextResponse.json(
                { error: "Title and author are required" },
                { status: 400 },
            );
        }

        // Check ISBN uniqueness if provided
        if (isbn) {
            const { data: existingBooks, error: checkError } =
                await supabaseAdmin
                    .from("books")
                    .select("id")
                    .eq("isbn", isbn)
                    .is("deleted_at", null);

            if (checkError) {
                console.error("Database error:", checkError);
                return NextResponse.json(
                    { error: "Database error: " + checkError.message },
                    { status: 500 },
                );
            }

            if (existingBooks && existingBooks.length > 0) {
                return NextResponse.json(
                    { error: "Book with this ISBN already exists" },
                    { status: 409 },
                );
            }
        }

        // Create book
        const { data: newBooks, error: createError } = await supabaseAdmin
            .from("books")
            .insert([
                {
                    title,
                    author,
                    isbn: isbn || null,
                    publisher: publisher || null,
                    published_year: published_year || null,
                    description: description || null,
                    status: "available",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ])
            .select(
                "id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at",
            );

        if (createError) {
            console.error("Database error:", createError);
            return NextResponse.json(
                { error: "Database error: " + createError.message },
                { status: 500 },
            );
        }

        const book = newBooks?.[0];

        return NextResponse.json({ book }, { status: 201 });
    } catch (error) {
        console.error("Create book error:", error);
        if (
            error instanceof Error &&
            error.message.includes("Authentication failed")
        ) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            {
                error:
                    "Internal server error: " +
                    (error instanceof Error ? error.message : "Unknown error"),
            },
            { status: 500 },
        );
    }
}
