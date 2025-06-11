import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(request)

    const bookId = Number.parseInt(params.id)
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 })
    }

    const books = await sql`
      SELECT b.*, 
             c.id as checkout_id, c.user_id, c.borrowed_date, c.due_date, c.return_date, c.status as checkout_status,
             u.name as user_name, u.email as user_email
      FROM books b
      LEFT JOIN checkouts c ON b.id = c.book_id AND c.status = 'borrowed'
      LEFT JOIN users u ON c.user_id = u.id
      WHERE b.id = ${bookId} AND b.deleted_at IS NULL
    `

    if (books.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const book = books[0]
    const checkouts = books
      .filter((row) => row.checkout_id)
      .map((row) => ({
        id: row.checkout_id,
        user_id: row.user_id,
        borrowed_date: row.borrowed_date,
        due_date: row.due_date,
        return_date: row.return_date,
        status: row.checkout_status,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        },
      }))

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publisher: book.publisher,
        published_year: book.published_year,
        description: book.description,
        status: book.status,
        created_at: book.created_at,
        updated_at: book.updated_at,
        checkouts,
      },
    })
  } catch (error) {
    console.error("Get book error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(request)

    const bookId = Number.parseInt(params.id)
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 })
    }

    const { title, author, isbn, publisher, published_year, description } = await request.json()

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    // Check if book exists
    const existingBooks = await sql`
      SELECT id, isbn FROM books WHERE id = ${bookId} AND deleted_at IS NULL
    `

    if (existingBooks.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const existingBook = existingBooks[0]

    // Check ISBN uniqueness if changed
    if (isbn && isbn !== existingBook.isbn) {
      const duplicateBooks = await sql`
        SELECT id FROM books WHERE isbn = ${isbn} AND id != ${bookId} AND deleted_at IS NULL
      `

      if (duplicateBooks.length > 0) {
        return NextResponse.json({ error: "Book with this ISBN already exists" }, { status: 409 })
      }
    }

    // Update book
    const updatedBooks = await sql`
      UPDATE books 
      SET title = ${title}, author = ${author}, isbn = ${isbn || null}, 
          publisher = ${publisher || null}, published_year = ${published_year || null}, 
          description = ${description || null}, updated_at = NOW()
      WHERE id = ${bookId}
      RETURNING id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at
    `

    const book = updatedBooks[0]

    return NextResponse.json({ book })
  } catch (error) {
    console.error("Update book error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAuth(request)

    const bookId = Number.parseInt(params.id)
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid book ID" }, { status: 400 })
    }

    // Check if book exists and get its status
    const books = await sql`
      SELECT id, status FROM books WHERE id = ${bookId} AND deleted_at IS NULL
    `

    if (books.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const book = books[0]

    // Check if book is borrowed
    if (book.status === "borrowed") {
      return NextResponse.json({ error: "Cannot delete borrowed book" }, { status: 400 })
    }

    // Check for active checkouts
    const activeCheckouts = await sql`
      SELECT COUNT(*) as count FROM checkouts 
      WHERE book_id = ${bookId} AND status = 'borrowed'
    `

    if (Number.parseInt(activeCheckouts[0].count) > 0) {
      return NextResponse.json({ error: "Cannot delete book with active checkouts" }, { status: 400 })
    }

    // Soft delete
    await sql`
      UPDATE books SET deleted_at = NOW() WHERE id = ${bookId}
    `

    return NextResponse.json({ message: "Book deleted successfully" })
  } catch (error) {
    console.error("Delete book error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
