import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(request)

    const checkoutId = Number.parseInt(params.id)
    if (isNaN(checkoutId)) {
      return NextResponse.json({ error: "Invalid checkout ID" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const returnDate = body.return_date ? new Date(body.return_date) : new Date()

    // Check if checkout exists and is active
    const checkouts = await sql`
      SELECT id, book_id, status FROM checkouts 
      WHERE id = ${checkoutId} AND status = 'borrowed' AND deleted_at IS NULL
    `

    if (checkouts.length === 0) {
      return NextResponse.json({ error: "Active checkout not found" }, { status: 404 })
    }

    const checkout = checkouts[0]

    // Begin transaction
    await sql`BEGIN`

    try {
      // Update checkout
      const updatedCheckouts = await sql`
        UPDATE checkouts 
        SET return_date = ${returnDate.toISOString()}, status = 'returned', updated_at = NOW()
        WHERE id = ${checkoutId}
        RETURNING id, book_id, user_id, borrowed_date, due_date, return_date, status, created_at, updated_at
      `

      // Update book status
      await sql`
        UPDATE books SET status = 'available', updated_at = NOW() WHERE id = ${checkout.book_id}
      `

      await sql`COMMIT`

      // Get checkout with details
      const checkoutDetails = await sql`
        SELECT c.*, 
               b.title as book_title, b.author as book_author, b.isbn as book_isbn,
               u.name as user_name, u.email as user_email
        FROM checkouts c
        LEFT JOIN books b ON c.book_id = b.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ${checkoutId}
      `

      const detailedCheckout = checkoutDetails[0]

      return NextResponse.json({
        checkout: {
          id: detailedCheckout.id,
          book_id: detailedCheckout.book_id,
          user_id: detailedCheckout.user_id,
          borrowed_date: detailedCheckout.borrowed_date,
          due_date: detailedCheckout.due_date,
          return_date: detailedCheckout.return_date,
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
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Return book error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
