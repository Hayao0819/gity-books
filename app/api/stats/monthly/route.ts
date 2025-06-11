import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = Number.parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month. Must be between 1 and 12" }, { status: 400 })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get daily checkout counts
    const checkoutStats = await sql`
      SELECT DATE(borrowed_date) as date, COUNT(*) as count
      FROM checkouts 
      WHERE borrowed_date >= ${startDate.toISOString()} 
        AND borrowed_date <= ${endDate.toISOString()}
        AND deleted_at IS NULL
      GROUP BY DATE(borrowed_date)
      ORDER BY date
    `

    // Get daily return counts
    const returnStats = await sql`
      SELECT DATE(return_date) as date, COUNT(*) as count
      FROM checkouts 
      WHERE return_date >= ${startDate.toISOString()} 
        AND return_date <= ${endDate.toISOString()}
        AND status = 'returned'
        AND deleted_at IS NULL
      GROUP BY DATE(return_date)
      ORDER BY date
    `

    // Merge data by date
    const statsMap = new Map()

    checkoutStats.forEach((stat) => {
      const dateStr = stat.date
      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, { month: dateStr, checkouts: 0, returns: 0 })
      }
      statsMap.get(dateStr).checkouts = Number.parseInt(stat.count)
    })

    returnStats.forEach((stat) => {
      const dateStr = stat.date
      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, { month: dateStr, checkouts: 0, returns: 0 })
      }
      statsMap.get(dateStr).returns = Number.parseInt(stat.count)
    })

    const stats = Array.from(statsMap.values())

    return NextResponse.json({
      year,
      month,
      stats,
    })
  } catch (error) {
    console.error("Get monthly stats error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
