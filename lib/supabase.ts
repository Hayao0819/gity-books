import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation function
function validateSupabaseConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!supabaseUrl) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL is not set");
    }

    if (!supabaseAnonKey) {
        errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Safe client creation
function createSupabaseClient(): SupabaseClient | null {
    try {
        const config = validateSupabaseConfig();

        if (!config.isValid) {
            console.warn("Supabase configuration invalid:", config.errors);
            return null;
        }

        return createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (error) {
        console.error("Failed to create Supabase client:", error);
        return null;
    }
}

function createSupabaseAdminClient(): SupabaseClient | null {
    try {
        if (!supabaseUrl) {
            console.warn("NEXT_PUBLIC_SUPABASE_URL not set for admin client");
            return null;
        }

        const serviceKey = supabaseServiceKey || supabaseAnonKey;
        if (!serviceKey) {
            console.warn(
                "No service key or anon key available for admin client",
            );
            return null;
        }

        return createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    } catch (error) {
        console.error("Failed to create Supabase admin client:", error);
        return null;
    }
}

// Export clients
export const supabase = createSupabaseClient();
export const supabaseAdmin = createSupabaseAdminClient();

// Helper functions
export function isSupabaseConfigured(): boolean {
    return validateSupabaseConfig().isValid;
}

export function getSupabaseConfig() {
    return {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        isConfigured: isSupabaseConfigured(),
    };
}

// Safe database test function
export async function testSupabaseConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
}> {
    try {
        if (!supabaseAdmin) {
            return {
                success: false,
                error: "Supabase admin client not available",
                details: getSupabaseConfig(),
            };
        }

        // Simple query to test connection
        const { data, error } = await supabaseAdmin
            .from("books")
            .select("id")
            .limit(1)
            .maybeSingle();

        if (error) {
            return {
                success: false,
                error: error.message,
                details: {
                    code: error.code,
                    hint: error.hint,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown connection error",
            details:
                error instanceof Error ? { stack: error.stack } : undefined,
        };
    }
}
