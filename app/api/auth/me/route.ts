import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request)

    // Get user details
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, student_id, created_at')
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        student_id: user.student_id,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("Get me error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
