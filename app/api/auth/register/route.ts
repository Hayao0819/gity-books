import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/database"
import { generateToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, student_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql(`SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`, [email])

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUsers = await sql(
      `INSERT INTO users (name, email, password, student_id, role, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, role, student_id, created_at`,
      [
        name,
        email,
        hashedPassword,
        student_id || null,
        "user", // default role
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    )

    const user = newUsers[0]

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        token,
        user,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
