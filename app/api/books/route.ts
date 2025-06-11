import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    let whereClause = "WHERE deleted_at IS NULL"
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR isbn ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM books ${whereClause}`
    const countResult = await sql.unsafe(countQuery, params)
    const total = Number.parseInt(countResult[0].total)

    // Get books with pagination
    const booksQuery = `
      SELECT id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at
      FROM books 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    const books = await sql.unsafe(booksQuery, params)

    return NextResponse.json({
      books,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get books error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const { title, author, isbn, publisher, published_year, description } = await request.json()

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    // Check ISBN uniqueness if provided
    if (isbn) {
      const existingBooks = await sql`
        SELECT id FROM books WHERE isbn = ${isbn} AND deleted_at IS NULL
      `

      if (existingBooks.length > 0) {
        return NextResponse.json({ error: "Book with this ISBN already exists" }, { status: 409 })
      }
    }

    // Create book
    const newBooks = await sql`
      INSERT INTO books (title, author, isbn, publisher, published_year, description, status, created_at, updated_at)
      VALUES (${title}, ${author}, ${isbn || null}, ${publisher || null}, ${published_year || null}, ${description || null}, 'available', NOW(), NOW())
      RETURNING id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at
    `

    const book = newBooks[0]

    return NextResponse.json({ book }, { status: 201 })
  } catch (error) {
    console.error("Create book error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
