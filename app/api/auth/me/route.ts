import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        // Return user information from Keycloak token and application database
        console.log("Authenticated user:", user);
        return NextResponse.json({
            user: {
                id: user.app_user_id,
                sub: user.sub, // Keycloak user ID
                name: user.name,
                email: user.email,
                preferred_username: user.preferred_username,
                role: user.role, // Application role from database
            },
        });
    } catch (error) {
        console.error("Get user error:", error);
        if (
            error instanceof Error &&
            error.message.includes("Authentication failed")
        ) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
