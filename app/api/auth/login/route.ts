import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        // Get user from database
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email, name, role, password_hash")
            .eq("email", email)
            .is("deleted_at", null)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash,
        );
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Return user data without password
        const { password_hash, ...userWithoutPassword } = user;

        return NextResponse.json({
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
