import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(request)

    const bookId = Number.parseInt(params.id)
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 })
    }

    const { status } = await request.json()

    if (!status || !["available", "borrowed", "maintenance"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be available, borrowed, or maintenance" },
        { status: 400 },
      )
    }

    // Check if book exists
    const books = await sql`
      SELECT id FROM books WHERE id = ${bookId} AND deleted_at IS NULL
    `

    if (books.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Update status
    const updatedBooks = await sql`
      UPDATE books 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${bookId}
      RETURNING id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at
    `

    const book = updatedBooks[0]

    return NextResponse.json({ book })
  } catch (error) {
    console.error("Update book status error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
