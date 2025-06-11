import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/jwt";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Missing or invalid authorization header");
        }

        const token = authHeader.substring(7);

        if (!token) {
            throw new Error("Missing token");
        }

        // Verify JWT token
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            throw new Error("Invalid token");
        }

        // Get user from database
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email, name, role")
            .eq("id", decoded.userId)
            .is("deleted_at", null)
            .single();

        if (error || !user) {
            throw new Error("User not found");
        }

        return user as AuthUser;
    } catch (error) {
        console.error("Auth error:", error);
        throw new Error(
            "Authentication failed: " +
                (error instanceof Error ? error.message : "Unknown error"),
        );
    }
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

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
    const user = await requireAuth(request);

    if (user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    return user;
}
