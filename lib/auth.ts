import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { supabase, supabaseAdmin } from "./supabase";

export interface AuthUser {
    email: string;
    name?: string;
    role: string;
    app_user_id?: number;
    sub?: string; // Keycloak user ID
    preferred_username?: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
    if (!process.env.AUTH_SECRET) {
        console.error("AUTH_SECRET is not set in environment variables");
        throw new Error(
            "Authentication failed: Server misconfiguration (no AUTH_SECRET)",
        );
    }

    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
    });
    if (!token) {
        console.error("No token found in request. Headers:", request.headers);
        throw new Error("Authentication failed: No token found in request");
    }
    if (!token.email) {
        console.error("Token found but no email. Token:", token);
        throw new Error("Authentication failed: Token has no email");
    }

    // DBからユーザー情報取得
    const { data: users, error } = await supabase
        .from("users")
        .select("id, email, role, name")
        .eq("email", String(token.email))
        .is("deleted_at", null)
        .limit(1);

    if (error) {
        console.error("Database error during auth:", error);
        throw new Error("Authentication failed: Database error");
    }

    let appUser = users?.[0];

    // ユーザーが存在しない場合は新規作成
    if (!appUser) {
        const { data: newUsers, error: createError } = await supabaseAdmin
            .from("users")
            .insert({
                email: String(token.email),
                name: token.name ?? String(token.email),
                role: "user",
                student_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select("id, email, role, name")
            .single();

        if (createError) {
            console.error("Error creating user:", createError);
            throw new Error("Authentication failed: Could not create user");
        }

        appUser = newUsers;
    }

    return {
        email: String(token.email),
        name: token.name ?? undefined,
        role: appUser.role,
        app_user_id: appUser.id,
        sub: token.sub ?? undefined,
        preferred_username:
            typeof token.preferred_username === "string"
                ? token.preferred_username
                : undefined,
    };
}

export async function optionalAuth(
    request: NextRequest,
): Promise<AuthUser | null> {
    try {
        return await requireAuth(request);
    } catch {
        return null;
    }
}

export function requireRole(user: AuthUser, requiredRole: string): void {
    if (user.role !== requiredRole && user.role !== "admin") {
        throw new Error("Insufficient permissions");
    }
}

export async function requireAdmin(request: NextRequest): Promise<void> {
    const user = await requireAuth(request);
    if (user.role !== "admin") {
        throw new Error("Insufficient permissions: Admin role required");
    }
}
