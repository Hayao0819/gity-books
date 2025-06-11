import type { NextRequest } from "next/server"
import { verifyToken } from "./jwt"
import { supabaseAdmin } from "./supabase"

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization token")
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyToken(token)

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role")
      .eq("id", payload.userId)
      .is("deleted_at", null)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return user
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export async function requireAdminAuth(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)

  if (user.role !== "admin") {
    throw new Error("Admin access required")
  }

  return user
}
