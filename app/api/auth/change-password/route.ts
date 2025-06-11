import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
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
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', authUser.userId)
      .is('deleted_at', null)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
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
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password: hashedNewPassword, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', authUser.userId)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
