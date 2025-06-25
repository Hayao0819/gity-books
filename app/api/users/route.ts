import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/jwt";

export async function GET(request: NextRequest) {
    try {
        requireAdmin(request);

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const page = Number.parseInt(searchParams.get("page") || "1");
        const limit = Math.min(
            Number.parseInt(searchParams.get("limit") || "10"),
            100,
        );
        const offset = (page - 1) * limit;

        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        let query = supabaseAdmin
            .from("users")
            .select(
                "id, name, email, role, student_id, created_at, updated_at",
                { count: "exact" },
            )
            .is("deleted_at", null);

        if (search) {
            query = query.or(
                `name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`,
            );
        }

        if (role) {
            query = query.eq("role", role as "user" | "admin");
        }

        const {
            data: users,
            error,
            count,
        } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            users: users || [],
            pagination: {
                total: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Get users error:", error);
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

export async function POST(request: NextRequest) {
    try {
        requireAdmin(request);

        const { name, email, password, student_id, role } =
            await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 },
            );
        }

        // Check if email already exists
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: existingUsers, error: emailCheckError } =
            await supabaseAdmin
                .from("users")
                .select("id")
                .eq("email", email)
                .is("deleted_at", null);

        if (emailCheckError) {
            console.error("Database error:", emailCheckError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 409 },
            );
        }

        // Check if student_id already exists (if provided)
        if (student_id) {
            if (!supabaseAdmin) {
                console.error("Supabase admin client is null");
                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }
            const { data: existingStudentId, error: studentIdCheckError } =
                await supabaseAdmin
                    .from("users")
                    .select("id")
                    .eq("student_id", student_id)
                    .is("deleted_at", null);

            if (studentIdCheckError) {
                console.error("Database error:", studentIdCheckError);
                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 },
                );
            }

            if (existingStudentId && existingStudentId.length > 0) {
                return NextResponse.json(
                    { error: "Student ID already exists" },
                    { status: 409 },
                );
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: newUsers, error: createError } = await supabaseAdmin
            .from("users")
            .insert([{
                    name: name,
                    email: email,
                    password_hash: hashedPassword,
                    student_id: student_id || null,
                    role: role || "user",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }])
            .select(
                "id, name, email, role, student_id, created_at, updated_at",
            );

        if (createError) {
            console.error("Database error:", createError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        const user = newUsers[0];

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error("Create user error:", error);
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
