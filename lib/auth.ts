import type { NextRequest } from "next/server"
import { verifyToken } from "./jwt"
import { supabase } from "./database"

export interface AuthUser {
  id: number
  email: string
  role: string
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authentication failed: No token provided")
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyToken(token)

    // Verify user still exists and is active
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", payload.id)
      .is("deleted_at", null)
      .limit(1)

    if (error) {
      console.error("Database error during auth:", error)
      throw new Error("Authentication failed: Database error")
    }

    const user = users?.[0]
    if (!user) {
      throw new Error("Authentication failed: User not found")
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error("Auth error:", error)
    throw new Error("Authentication failed: Invalid token")
  }
}

export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(request)
  } catch {
    return null
  }
}

export function requireRole(user: AuthUser, requiredRole: string): void {
  if (user.role !== requiredRole && user.role !== "admin") {
    throw new Error("Insufficient permissions")
  }
}
