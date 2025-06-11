import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { optionalAuth, requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Optional authentication for reading books
    const user = await optionalAuth(request)
    console.log("User authenticated:", user ? user.email : "No user")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100)
    const offset = (page - 1) * limit

    console.log("Query params:", { search, status, page, limit, offset })

    // Build the query
    let query = `
            SELECT id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at
            FROM books 
            WHERE deleted_at IS NULL
        `
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR isbn ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM books WHERE deleted_at IS NULL`
    const countParams: any[] = []
    let countParamIndex = 1

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR author ILIKE $${countParamIndex} OR isbn ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`
      countParams.push(status)
    }

    const [books, countResult] = await Promise.all([sql(query, params), sql(countQuery, countParams)])

    const total = Number.parseInt(countResult[0]?.count || "0")

    console.log("Books fetched successfully:", books?.length || 0)

    return NextResponse.json({
      books: books || [],
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get books error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { title, author, isbn, publisher, published_year, description } = await request.json()

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    // Check ISBN uniqueness if provided
    if (isbn) {
      const existingBooks = await sql(`SELECT id FROM books WHERE isbn = $1 AND deleted_at IS NULL`, [isbn])

      if (existingBooks && existingBooks.length > 0) {
        return NextResponse.json({ error: "Book with this ISBN already exists" }, { status: 409 })
      }
    }

    // Create book
    const newBooks = await sql(
      `INSERT INTO books (title, author, isbn, publisher, published_year, description, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, title, author, isbn, publisher, published_year, description, status, created_at, updated_at`,
      [
        title,
        author,
        isbn || null,
        publisher || null,
        published_year || null,
        description || null,
        "available",
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    )

    const book = newBooks?.[0]

    return NextResponse.json({ book }, { status: 201 })
  } catch (error) {
    console.error("Create book error:", error)
    if (error instanceof Error && error.message.includes("Authentication failed")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      {
        error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
