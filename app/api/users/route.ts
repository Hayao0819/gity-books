import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(_: NextRequest) {
    // Supabase設定チェック
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

    // ユーザー一覧取得
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
}
