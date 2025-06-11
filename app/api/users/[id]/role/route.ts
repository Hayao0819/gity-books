import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        requireAdmin(request);

        const userId = Number.parseInt(params.id);
        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }

        const { role } = await request.json();

        if (!role || !["user", "admin"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be user or admin" },
                { status: 400 },
            );
        }

        // Check if user exists
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: users, error: checkError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("id", userId)
            .is("deleted_at", null);

        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Update role
        const { data: updatedUsers, error: updateError } = await supabaseAdmin
            .from("users")
            .update({
                role,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select(
                "id, name, email, role, student_id, created_at, updated_at",
            );

        if (updateError) {
            console.error("Database error:", updateError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        const user = updatedUsers[0];

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Update user role error:", error);
        if (
            error instanceof Error &&
            (error.message.includes("token") || error.message.includes("Admin"))
        ) {
            return NextResponse.json(
                { error: error.message },
                { status: error.message.includes("Admin") ? 403 : 401 },
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
