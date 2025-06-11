import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const userId = searchParams.get("user_id") || ""
    const bookId = searchParams.get("book_id") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    let whereClause = "WHERE c.deleted_at IS NULL"
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (userId) {
      whereClause += ` AND c.user_id = $${paramIndex}`
      params.push(Number.parseInt(userId))
      paramIndex++
    }

    if (bookId) {
      whereClause += ` AND c.book_id = $${paramIndex}`
      params.push(Number.parseInt(bookId))
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM checkouts c ${whereClause}`
    const countResult = await sql.unsafe(countQuery, params)
    const total = Number.parseInt(countResult[0].total)

    // Get checkouts with book and user details
    const checkoutsQuery = `
      SELECT c.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             u.name as user_name, u.email as user_email, u.student_id as user_student_id
      FROM checkouts c
      LEFT JOIN books b ON c.book_id = b.id
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    const checkouts = await sql.unsafe(checkoutsQuery, params)

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
    console.error("Get checkouts error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const { book_id, user_id, due_date } = await request.json()

    if (!book_id || !user_id) {
      return NextResponse.json({ error: "Book ID and User ID are required" }, { status: 400 })
    }

    // Check if book exists and is available
    const books = await sql`
      SELECT id, status FROM books WHERE id = ${book_id} AND deleted_at IS NULL
    `

    if (books.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const book = books[0]

    if (book.status !== "available") {
      return NextResponse.json({ error: "Book is not available for checkout" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${user_id} AND deleted_at IS NULL
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check user's checkout limit (max 5 books)
    const activeCheckouts = await sql`
      SELECT COUNT(*) as count FROM checkouts 
      WHERE user_id = ${user_id} AND status = 'borrowed'
    `

    if (Number.parseInt(activeCheckouts[0].count) >= 5) {
      return NextResponse.json({ error: "User has reached maximum checkout limit (5 books)" }, { status: 400 })
    }

    // Set due date (default 2 weeks from now)
    const dueDateValue = due_date ? new Date(due_date) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Begin transaction
    await sql`BEGIN`

    try {
      // Create checkout
      const newCheckouts = await sql`
        INSERT INTO checkouts (book_id, user_id, borrowed_date, due_date, status, created_at, updated_at)
        VALUES (${book_id}, ${user_id}, NOW(), ${dueDateValue.toISOString()}, 'borrowed', NOW(), NOW())
        RETURNING id, book_id, user_id, borrowed_date, due_date, status, created_at, updated_at
      `

      // Update book status
      await sql`
        UPDATE books SET status = 'borrowed', updated_at = NOW() WHERE id = ${book_id}
      `

      await sql`COMMIT`

      const checkout = newCheckouts[0]

      // Get checkout with details
      const checkoutDetails = await sql`
        SELECT c.*, 
               b.title as book_title, b.author as book_author, b.isbn as book_isbn,
               u.name as user_name, u.email as user_email
        FROM checkouts c
        LEFT JOIN books b ON c.book_id = b.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ${checkout.id}
      `

      const detailedCheckout = checkoutDetails[0]

      return NextResponse.json(
        {
          checkout: {
            id: detailedCheckout.id,
            book_id: detailedCheckout.book_id,
            user_id: detailedCheckout.user_id,
            borrowed_date: detailedCheckout.borrowed_date,
            due_date: detailedCheckout.due_date,
            status: detailedCheckout.status,
            created_at: detailedCheckout.created_at,
            updated_at: detailedCheckout.updated_at,
            book: {
              id: detailedCheckout.book_id,
              title: detailedCheckout.book_title,
              author: detailedCheckout.book_author,
              isbn: detailedCheckout.book_isbn,
            },
            user: {
              id: detailedCheckout.user_id,
              name: detailedCheckout.user_name,
              email: detailedCheckout.user_email,
            },
          },
        },
        { status: 201 },
      )
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Create checkout error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
