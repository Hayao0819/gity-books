import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const userId = Number.parseInt(params.id);
        if (Number.isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }
        const { data: users, error } = await supabaseAdmin
            .from("users")
            .select("id, name, email, role, created_at, updated_at")
            .eq("id", userId)
            .is("deleted_at", null);
        if (error) {
            console.error("Database error:", error);
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
        const user = users[0];
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const userId = Number.parseInt(params.id);
        if (Number.isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }
        const { role } = await request.json();
        // Check if user exists
        const { data: existingUsers, error: checkError } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .eq("id", userId)
            .is("deleted_at", null);
        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        if (!existingUsers || existingUsers.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }
        // Prepare update data (roleのみ更新)
        const updateData: {
            role: "user" | "admin";
            updated_at: string;
        } = {
            role: role === "admin" ? "admin" : "user",
            updated_at: new Date().toISOString(),
        };
        const { data: updatedUsers, error: updateError } = await supabaseAdmin
            .from("users")
            .update(updateData)
            .eq("id", userId)
            .select("id, name, email, role, created_at, updated_at");
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
        console.error("Update user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const userId = Number.parseInt(params.id);
        if (Number.isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 },
            );
        }
        // Check if user exists
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
        // Soft delete
        const { error: deleteError } = await supabaseAdmin
            .from("users")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", userId);
        if (deleteError) {
            console.error("Database error:", deleteError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
