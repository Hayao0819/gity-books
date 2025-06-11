import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    // Get total books
    const totalBooksResult = await sql`
      SELECT COUNT(*) as total FROM books WHERE deleted_at IS NULL
    `
    const totalBooks = Number.parseInt(totalBooksResult[0].total)

    // Get available books
    const availableBooksResult = await sql`
      SELECT COUNT(*) as total FROM books WHERE status = 'available' AND deleted_at IS NULL
    `
    const availableBooks = Number.parseInt(availableBooksResult[0].total)

    // Get borrowed books
    const borrowedBooksResult = await sql`
      SELECT COUNT(*) as total FROM books WHERE status = 'borrowed' AND deleted_at IS NULL
    `
    const borrowedBooks = Number.parseInt(borrowedBooksResult[0].total)

    // Get monthly checkouts (current month)
    const monthlyCheckoutsResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE borrowed_date >= DATE_TRUNC('month', CURRENT_DATE) AND deleted_at IS NULL
    `
    const monthlyCheckouts = Number.parseInt(monthlyCheckoutsResult[0].total)

    // Get overdue books
    const overdueBooksResult = await sql`
      SELECT COUNT(*) as total FROM checkouts 
      WHERE status = 'borrowed' AND due_date < NOW() AND deleted_at IS NULL
    `
    const overdueBooks = Number.parseInt(overdueBooksResult[0].total)

    // Get total users
    const totalUsersResult = await sql`
      SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL
    `
    const totalUsers = Number.parseInt(totalUsersResult[0].total)

    return NextResponse.json({
      total_books: totalBooks,
      available_books: availableBooks,
      borrowed_books: borrowedBooks,
      monthly_checkouts: monthlyCheckouts,
      overdue_books: overdueBooks,
      total_users: totalUsers,
    })
  } catch (error) {
    console.error("Get stats overview error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
