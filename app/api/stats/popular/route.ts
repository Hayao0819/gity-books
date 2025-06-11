import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)

    const popularBooks = await sql`
      SELECT b.id, b.title, b.author, COUNT(c.id) as checkout_count
      FROM books b
      LEFT JOIN checkouts c ON b.id = c.book_id AND c.deleted_at IS NULL
      WHERE b.deleted_at IS NULL
      GROUP BY b.id, b.title, b.author
      ORDER BY checkout_count DESC
      LIMIT ${limit}
    `

    const books = popularBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      checkout_count: Number.parseInt(book.checkout_count),
    }))

    return NextResponse.json({ books })
  } catch (error) {
    console.error("Get popular books error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
