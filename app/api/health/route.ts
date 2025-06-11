import { NextResponse } from "next/server"
import { testSupabaseConnection } from "@/lib/supabase"

export async function GET() {
  try {
    const dbConnected = await testSupabaseConnection()

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "connected" : "disconnected",
      environment: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing",
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing",
        jwt_secret: process.env.JWT_SECRET ? "set" : "missing",
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
