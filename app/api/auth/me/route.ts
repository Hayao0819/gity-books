import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        // Get full user details from database
        const { data: users, error } = await supabase
            .from("users")
            .select("id, name, email, role, student_id, created_at")
            .eq("id", user.id)
            .is("deleted_at", null)
            .limit(1);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Database error" },
                { status: 500 },
            );
        }

        const userData = users?.[0];
        if (!userData) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            user: userData,
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
