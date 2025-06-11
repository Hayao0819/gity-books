import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"
import { hashPassword, comparePassword } from "@/lib/jwt"

export async function PUT(request: NextRequest) {
  try {
    const authUser = requireAuth(request)
    const { current_password, new_password } = await request.json()

    if (!current_password || !new_password) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    // Get user's current password
    const users = await sql`
      SELECT password FROM users WHERE id = ${authUser.userId} AND deleted_at IS NULL
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Verify current password
    const isValidPassword = await comparePassword(current_password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(new_password)

    // Update password
    await sql`
      UPDATE users 
      SET password = ${hashedNewPassword}, updated_at = NOW()
      WHERE id = ${authUser.userId}
    `

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
