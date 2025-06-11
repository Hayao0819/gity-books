import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/database"
import { generateToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const users = await sql(
      `SELECT id, name, email, password, role, student_id, created_at 
             FROM users 
             WHERE email = $1 AND deleted_at IS NULL`,
      [email],
    )

    const user = users[0]

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
