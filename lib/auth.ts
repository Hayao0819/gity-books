import type { NextRequest } from "next/server";
import { supabase } from "./supabase";
import jwt from "jsonwebtoken";

export interface AuthUser {
    sub: string; // Keycloak user ID
    email: string;
    name?: string;
    preferred_username?: string;
    role: string; // Application role from database
    app_user_id?: number; // Application user ID from database
}

// Keycloak JWT verification
function verifyKeycloakToken(token: string): Record<string, unknown> {
    try {
        // In production, you should verify the token with Keycloak's public key
        // For now, we'll decode without verification (not recommended for production)
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded === "string") {
            throw new Error("Invalid token format");
        }
        return decoded as Record<string, unknown>;
    } catch (error) {
        throw new Error("Invalid Keycloak token");
    }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Authentication failed: No token provided");
    }

    const token = authHeader.substring(7);

    try {
        // Verify Keycloak token
        const keycloakPayload = verifyKeycloakToken(token);

        if (!keycloakPayload.sub || !keycloakPayload.email) {
            throw new Error("Invalid token: missing required fields");
        }

        // Get or create user in application database for role management
        const { data: users, error } = await supabase
            .from("users")
            .select("id, email, role, name")
            .eq("email", String(keycloakPayload.email))
            .is("deleted_at", null)
            .limit(1);

        if (error) {
            console.error("Database error during auth:", error);
            throw new Error("Authentication failed: Database error");
        }

        let appUser = users?.[0];

        // If user doesn't exist in app database, create them with default role
        if (!appUser) {
            const { data: newUsers, error: createError } = await supabase
                .from("users")
                .insert({
                    email: String(keycloakPayload.email),
                    name:
                        typeof keycloakPayload.name === "string"
                            ? keycloakPayload.name
                            : typeof keycloakPayload.preferred_username === "string"
                                ? keycloakPayload.preferred_username
                                : String(keycloakPayload.email),
                    role: "user", // Default role
                    password_hash: "", // Not used with Keycloak
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
            sub: typeof keycloakPayload.sub === "string" ? keycloakPayload.sub : String(keycloakPayload.sub),
            email: String(keycloakPayload.email),
            name: typeof keycloakPayload.name === "string"
                ? keycloakPayload.name
                : typeof keycloakPayload.preferred_username === "string"
                    ? keycloakPayload.preferred_username
                    : undefined,
            preferred_username: typeof keycloakPayload.preferred_username === "string"
                ? keycloakPayload.preferred_username
                : undefined,
            role: appUser.role,
            app_user_id: appUser.id,
        };
    } catch (error) {
        console.error("Auth error:", error);
        throw new Error("Authentication failed: Invalid token");
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
