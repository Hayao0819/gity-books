import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { user_id: string } }) {
  try {
    requireAuth(request)

    const userId = Number.parseInt(params.user_id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Get total checkouts
    const totalCheckoutsResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE user_id = ${userId} AND deleted_at IS NULL
    `
    const totalCheckouts = Number.parseInt(totalCheckoutsResult[0].total)

    // Get active checkouts
    const activeCheckoutsResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE user_id = ${userId} AND status = 'borrowed' AND deleted_at IS NULL
    `
    const activeCheckouts = Number.parseInt(activeCheckoutsResult[0].total)

    // Get overdue checkouts
    const overdueCheckoutsResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE user_id = ${userId} AND status = 'borrowed' AND due_date < NOW() AND deleted_at IS NULL
    `
    const overdueCheckouts = Number.parseInt(overdueCheckoutsResult[0].total)

    // Get returned books
    const returnedBooksResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE user_id = ${userId} AND status = 'returned' AND deleted_at IS NULL
    `
    const returnedBooks = Number.parseInt(returnedBooksResult[0].total)

    return NextResponse.json({
      total_checkouts: totalCheckouts,
      active_checkouts: activeCheckouts,
      overdue_checkouts: overdueCheckouts,
      returned_books: returnedBooks,
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
