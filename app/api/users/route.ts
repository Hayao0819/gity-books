import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAdmin } from "@/lib/auth"
import { hashPassword } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    let whereClause = "WHERE deleted_at IS NULL"
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR student_id ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      whereClause += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await sql.unsafe(countQuery, params)
    const total = Number.parseInt(countResult[0].total)

    // Get users with pagination
    const usersQuery = `
      SELECT id, name, email, role, student_id, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    const users = await sql.unsafe(usersQuery, params)

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const { name, email, password, student_id, role } = await request.json()

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
      VALUES (${name}, ${email}, ${hashedPassword}, ${student_id || null}, ${role || "user"}, NOW(), NOW())
      RETURNING id, name, email, role, student_id, created_at, updated_at
    `

    const user = newUsers[0]

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
