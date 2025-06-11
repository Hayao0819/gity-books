import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

// Supabaseから返されるチェックアウトデータの型を定義
interface SupabaseCheckout {
  id: number
  book_id: number
  user_id: number
  borrowed_date: string
  due_date: string
  return_date: string | null
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  books: {
    id: number
    title: string
    author: string
    isbn: string | null
  } | null
  users: {
    id: number
    name: string
    email: string
    student_id: string | null
  } | null
}

// フロントエンドに返すフォーマット済みチェックアウトの型
interface FormattedCheckout {
  id: number
  book_id: number
  user_id: number
  borrowed_date: string
  due_date: string
  return_date?: string
  status: string
  created_at: string
  updated_at: string
  book?: {
    id: number
    title: string
    author: string
    isbn: string
  }
  user?: {
    id: number
    name: string
    email: string
    student_id?: string
  }
}

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

    if (!supabaseAdmin) {
      console.error("Supabase admin client is null")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
    let query = supabaseAdmin
      .from("checkouts")
      .select(
        `
        *,
        books(id, title, author, isbn),
        users(id, name, email, student_id)
      `,
        { count: "exact" },
      )
      .is("deleted_at", null)

    if (status) {
      query = query.eq("status", status)
    }

    if (userId) {
      query = query.eq("user_id", Number.parseInt(userId))
    }

    if (bookId) {
      query = query.eq("book_id", Number.parseInt(bookId))
    }

    const {
      data: checkouts,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const formattedCheckouts: FormattedCheckout[] = (checkouts || []).map((checkout: SupabaseCheckout) => ({
      id: checkout.id,
      book_id: checkout.book_id,
      user_id: checkout.user_id,
      borrowed_date: checkout.borrowed_date,
      due_date: checkout.due_date,
      return_date: checkout.return_date || undefined,
      status: checkout.status,
      created_at: checkout.created_at,
      updated_at: checkout.updated_at,
      book: checkout.books
        ? {
            id: checkout.books.id,
            title: checkout.books.title,
            author: checkout.books.author,
            isbn: checkout.books.isbn || "",
          }
        : undefined,
      user: checkout.users
        ? {
            id: checkout.users.id,
            name: checkout.users.name,
            email: checkout.users.email,
            student_id: checkout.users.student_id || undefined,
          }
        : undefined,
    }))

    return NextResponse.json({
      checkouts: formattedCheckouts,
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
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
    if (!supabaseAdmin) {
      console.error("Supabase admin client is null")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
    const { data: books, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, status")
      .eq("id", book_id)
      .is("deleted_at", null)

    if (bookError) {
      console.error("Database error:", bookError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const book = books[0]

    if (book.status !== "available") {
      return NextResponse.json({ error: "Book is not available for checkout" }, { status: 400 })
    }

    // Check if user exists
    if (!supabaseAdmin) {
      console.error("Supabase admin client is null")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", user_id)
      .is("deleted_at", null)

    if (userError) {
      console.error("Database error:", userError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check user's checkout limit (max 5 books)
    if (!supabaseAdmin) {
      console.error("Supabase admin client is null")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
    const { data: activeCheckouts, error: checkoutError } = await supabaseAdmin
      .from("checkouts")
      .select("id", { count: "exact" })
      .eq("user_id", user_id)
      .eq("status", "borrowed")

    if (checkoutError) {
      console.error("Database error:", checkoutError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (activeCheckouts && activeCheckouts.length >= 5) {
      return NextResponse.json({ error: "User has reached maximum checkout limit (5 books)" }, { status: 400 })
    }

    // Set due date (default 2 weeks from now)
    const dueDateValue = due_date ? new Date(due_date) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Use Supabase transaction (RPC function)
    if (!supabaseAdmin) {
      console.error("Supabase admin client is null")
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
    const { data: result, error: transactionError } = await supabaseAdmin.rpc("create_checkout", {
      p_book_id: book_id,
      p_user_id: user_id,
      p_due_date: dueDateValue.toISOString(),
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
    }

    // Get checkout with details
    const { data: checkoutDetails, error: detailsError } = await supabaseAdmin
      .from("checkouts")
      .select(`
        *,
        books(id, title, author, isbn),
        users(id, name, email)
      `)
      .eq("id", result)
      .single()

    if (detailsError) {
      console.error("Database error:", detailsError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // 型アサーションを使用して適切な型を指定
    const checkout = checkoutDetails as unknown as SupabaseCheckout

    return NextResponse.json(
      {
        checkout: {
          id: checkout.id,
          book_id: checkout.book_id,
          user_id: checkout.user_id,
          borrowed_date: checkout.borrowed_date,
          due_date: checkout.due_date,
          status: checkout.status,
          created_at: checkout.created_at,
          updated_at: checkout.updated_at,
          book: checkout.books,
          user: checkout.users,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create checkout error:", error)
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
