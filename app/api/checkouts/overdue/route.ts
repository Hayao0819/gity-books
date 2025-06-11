import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    // Get total count of overdue checkouts
    const countResult = await sql`
      SELECT COUNT(*) as total FROM checkouts c
      WHERE c.status = 'borrowed' AND c.due_date < NOW() AND c.deleted_at IS NULL
    `
    const total = Number.parseInt(countResult[0].total)

    // Get overdue checkouts with book and user details
    const checkouts = await sql`
      SELECT c.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             u.name as user_name, u.email as user_email, u.student_id as user_student_id
      FROM checkouts c
      LEFT JOIN books b ON c.book_id = b.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'borrowed' AND c.due_date < NOW() AND c.deleted_at IS NULL
      ORDER BY c.due_date ASC
      LIMIT ${limit} OFFSET ${offset}
    `

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
      user: {
        id: checkout.user_id,
        name: checkout.user_name,
        email: checkout.user_email,
        student_id: checkout.user_student_id,
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
    console.error("Get overdue checkouts error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
