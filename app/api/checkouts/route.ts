import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import type { CheckoutWithBook } from "@/types/checkout";
import {
    transformCheckoutWithBook,
    type SupabaseCheckoutRecord,
} from "@/lib/utils/checkout-transform";

export async function GET(request: NextRequest) {
    try {
        await requireAuth(request);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const userId = searchParams.get("user_id") || "";
        const bookId = searchParams.get("book_id") || "";
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
        books(id, title, author, isbn),
        users(id, name, email, student_id)
      `,
                { count: "exact" },
            )
            .is("deleted_at", null);

        if (status) {
            query = query.eq("status", status as "borrowed" | "returned");
        }

        if (userId) {
            query = query.eq("user_id", Number.parseInt(userId));
        }

        if (bookId) {
            query = query.eq("book_id", Number.parseInt(bookId));
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

        const formattedCheckouts: CheckoutWithBook[] = (checkouts || []).map(
            transformCheckoutWithBook,
        );

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
        console.error("Get checkouts error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request);

        const { book_id, user_id, due_date } = await request.json();

        if (!book_id || !user_id) {
            return NextResponse.json(
                { error: "Book ID and User ID are required" },
                { status: 400 },
            );
        }

        // ユーザーの貸出上限チェック（5冊まで）
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: borrowedCheckouts, error: checkoutError } =
            await supabaseAdmin
                .from("checkouts")
                .select("id", { count: "exact" })
                .eq("user_id", user_id)
                .eq("status", "borrowed");

        if (checkoutError) {
            console.error("Database error:", checkoutError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (borrowedCheckouts && borrowedCheckouts.length >= 5) {
            return NextResponse.json(
                { error: "User has reached maximum checkout limit (5 books)" },
                { status: 400 },
            );
        }

        // 返却期限（指定がなければ2週間後）
        const dueDateValue = due_date
            ? new Date(due_date)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        // トランザクション（RPC）で貸出処理
        const { data: rpcResult, error: rpcError } = await (
            supabaseAdmin.rpc as unknown as (
                fn: string,
                params: Record<string, unknown>,
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            ) => Promise<{ data: any; error: any }>
        )("checkout_book", {
            p_book_id: book_id,
            p_user_id: user_id,
            p_due_date: dueDateValue.toISOString(),
        });

        if (rpcError) {
            console.error("Checkout RPC error:", rpcError);
            return NextResponse.json(
                { error: rpcError.message || "Failed to checkout book" },
                { status: 500 },
            );
        }

        // 詳細取得
        let checkoutDetails: SupabaseCheckoutRecord | null = null;
        let detailsError: unknown;
        if (rpcResult && rpcResult.length > 0) {
            const checkoutId = rpcResult[0].id;
            const { data, error } = await supabaseAdmin
                .from("checkouts")
                .select(`
        *,
        books(id, title, author, isbn),
        users(id, name, email, student_id)
      `)
                .eq("id", checkoutId)
                .single();
            checkoutDetails = data as SupabaseCheckoutRecord | null;
            detailsError = error as unknown;
        }

        if (detailsError) {
            console.error("Database error:", detailsError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                checkout: checkoutDetails
                    ? transformCheckoutWithBook(checkoutDetails)
                    : null,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Create checkout error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
