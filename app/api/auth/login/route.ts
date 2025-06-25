import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { generateToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        // Get user from database
        const { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .is("deleted_at", null)
            .limit(1);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Database error" },
                { status: 500 },
            );
        }

        const user = users?.[0];
        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
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

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
