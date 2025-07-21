import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import type { CheckoutWithBook } from "@/types/checkout-with-book";
import type { User } from "@/types/user";

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

        const formattedCheckouts: (CheckoutWithBook & { user?: User })[] = (
            checkouts || []
        ).map((checkout): CheckoutWithBook & { user?: User } => ({
            id: checkout.id,
            book_id: checkout.book_id,
            user_id: checkout.user_id,
            checkout_date: checkout.checkout_date ?? "",
            due_date: checkout.due_date,
            return_date: checkout.return_date ?? "",
            status: checkout.status,
            book: checkout.books
                ? {
                      id: checkout.books.id,
                      title: checkout.books.title,
                      author: checkout.books.author,
                      isbn: checkout.books.isbn ?? "",
                  }
                : undefined,
            user: checkout.users
                ? {
                      id: checkout.users.id,
                      name: checkout.users.name,
                      email: checkout.users.email,
                      role: "user", // 必須プロパティ。実際の値が必要ならDBから取得・マッピング
                      student_id: checkout.users.student_id ?? null,
                      created_at: "", // 必須プロパティ。実際の値が必要ならDBから取得・マッピング
                      updated_at: "", // 必須プロパティ。実際の値が必要ならDBから取得・マッピング
                      deleted_at: null, // 必須プロパティ。実際の値が必要ならDBから取得・マッピング
                  }
                : undefined,
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
