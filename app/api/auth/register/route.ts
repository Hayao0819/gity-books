import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { generateToken, hashPassword } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, student_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Check if student_id already exists (if provided)
    if (student_id) {
      const existingStudentId = await sql`
        SELECT id FROM users WHERE student_id = ${student_id} AND deleted_at IS NULL
      `

      if (existingStudentId.length > 0) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 409 })
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUsers = await sql`
      INSERT INTO users (name, email, password, student_id, role, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, ${student_id || null}, 'user', NOW(), NOW())
      RETURNING id, name, email, role, student_id, created_at
    `

    const user = newUsers[0]

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          student_id: user.student_id,
          created_at: user.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
