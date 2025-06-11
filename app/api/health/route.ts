import { NextResponse } from "next/server"

export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "library-management-api",
      version: "1.0.0",
      environment: {
        node_env: process.env.NODE_ENV || "development",
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing",
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "missing",
        jwt_secret: process.env.JWT_SECRET ? "configured" : "missing",
      },
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        service: "library-management-api",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
