import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey =
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    },
);

// Supabaseの設定が有効か判定する関数
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));
}
