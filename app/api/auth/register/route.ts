import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { name, email, password, student_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .is("deleted_at", null)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          student_id: student_id || null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id, name, email, role, student_id, created_at, updated_at")
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Generate JWT token
    const token = generateToken({ userId: newUser.id, email: newUser.email, role: newUser.role })

    return NextResponse.json(
      {
        token,
        user: newUser,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
