import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)

    // Get full user data from database
    const users = await sql(
      `SELECT id, name, email, role, student_id, created_at 
             FROM users 
             WHERE id = $1 AND deleted_at IS NULL`,
      [authUser.id],
    )

    const user = users[0]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get me error:", error)
    if (error instanceof Error && error.message.includes("Authentication failed")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
