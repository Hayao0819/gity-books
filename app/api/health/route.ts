import { type NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
    try {
        // Basic health check without external dependencies
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "library-management-api",
            version: "1.0.0",
            uptime: process.uptime(),
            environment: {
                node_env: process.env.NODE_ENV || "development",
                config: {
                    // Next.js public Supabase
                    next_public_supabase_url:
                        !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    next_public_supabase_anon_key:
                        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    // Server-side Supabase
                    supabase_url: !!process.env.SUPABASE_URL,
                    supabase_key: !!process.env.SUPABASE_KEY,
                    supabase_service_role_key:
                        !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                    // Auth
                    jwt_secret: !!process.env.JWT_SECRET,
                    auth_secret: !!process.env.AUTH_SECRET,
                },
            },
        };

        return NextResponse.json(health, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
    } catch (error) {
        // Ensure error is properly serialized
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error("Health check failed:", {
            message: errorMessage,
            stack: errorStack,
            error: error,
        });

        const errorResponse = {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            service: "library-management-api",
            error: {
                message: errorMessage,
                type:
                    error instanceof Error
                        ? error.constructor.name
                        : "UnknownError",
            },
        };

        return NextResponse.json(errorResponse, {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}

// Handle other HTTP methods
export async function POST() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
