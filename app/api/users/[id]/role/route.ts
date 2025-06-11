import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAdmin } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request)

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const { role } = await request.json()

    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be user or admin" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update role
    const updatedUsers = await sql`
      UPDATE users 
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, role, student_id, created_at, updated_at
    `

    const user = updatedUsers[0]

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update user role error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
