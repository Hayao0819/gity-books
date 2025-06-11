import type { NextRequest } from "next/server"
import { verifyToken } from "./jwt"

export function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header required")
  }

  const token = authHeader.substring(7)

  try {
    return verifyToken(token)
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export function requireAuth(request: NextRequest) {
  return getAuthUser(request)
}

export function requireAdmin(request: NextRequest) {
  const user = getAuthUser(request)

  if (user.role !== "admin") {
    throw new Error("Admin access required")
  }

  return user
}
