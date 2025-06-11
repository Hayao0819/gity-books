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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    let whereClause = "WHERE c.user_id = $1 AND c.deleted_at IS NULL"
    const queryParams: any[] = [userId]
    let paramIndex = 2

    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM checkouts c ${whereClause}`
    const countResult = await sql.unsafe(countQuery, queryParams)
    const total = Number.parseInt(countResult[0].total)

    // Get checkouts with book details
    const checkoutsQuery = `
      SELECT c.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM checkouts c
      LEFT JOIN books b ON c.book_id = b.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const checkouts = await sql.unsafe(checkoutsQuery, queryParams)

    const formattedCheckouts = checkouts.map((checkout) => ({
      id: checkout.id,
      book_id: checkout.book_id,
      user_id: checkout.user_id,
      borrowed_date: checkout.borrowed_date,
      due_date: checkout.due_date,
      return_date: checkout.return_date,
      status: checkout.status,
      created_at: checkout.created_at,
      updated_at: checkout.updated_at,
      book: {
        id: checkout.book_id,
        title: checkout.book_title,
        author: checkout.book_author,
        isbn: checkout.book_isbn,
      },
    }))

    return NextResponse.json({
      checkouts: formattedCheckouts,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get user checkouts error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
