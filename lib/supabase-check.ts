// lib/utils/supabase-check.ts
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * supabaseAdminの存在チェック。nullならエラーレスポンスを返す。
 * @returns true: 利用可能, false: レスポンス返却済み
 */
export function ensureSupabaseAdmin(): true | NextResponse {
    if (!supabaseAdmin) {
        console.error("Supabase admin client is null");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
    return true;
}
