import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { generateToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, student_id } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 },
            );
        }

        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .is("deleted_at", null);

        if (checkError) {
            console.error("Database error:", checkError);
            return NextResponse.json(
                { error: "Database error" },
                { status: 500 },
            );
        }

        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 },
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const { data: newUsers, error: createError } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword,
                    student_id: student_id || null,
                    role: "user",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ])
            .select("id, name, email, role, student_id, created_at");

        if (createError) {
            console.error("Database error:", createError);
            return NextResponse.json(
                { error: `Database error: ${createError.message}` },
                { status: 500 },
            );
        }

        const user = newUsers?.[0];
        if (!user) {
            return NextResponse.json(
                { error: "Failed to create user" },
                { status: 500 },
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return NextResponse.json(
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
