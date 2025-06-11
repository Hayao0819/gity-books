import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { requireAdmin } from "@/lib/auth"
import { hashPassword } from "@/lib/jwt"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request)

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const users = await sql`
      SELECT u.id, u.name, u.email, u.role, u.student_id, u.created_at, u.updated_at,
             c.id as checkout_id, c.book_id, c.borrowed_date, c.due_date, c.return_date, c.status as checkout_status,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM users u
      LEFT JOIN checkouts c ON u.id = c.user_id AND c.deleted_at IS NULL
      LEFT JOIN books b ON c.book_id = b.id
      WHERE u.id = ${userId} AND u.deleted_at IS NULL
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]
    const checkouts = users
      .filter((row) => row.checkout_id)
      .map((row) => ({
        id: row.checkout_id,
        book_id: row.book_id,
        borrowed_date: row.borrowed_date,
        due_date: row.due_date,
        return_date: row.return_date,
        status: row.checkout_status,
        book: {
          id: row.book_id,
          title: row.book_title,
          author: row.book_author,
          isbn: row.book_isbn,
        },
      }))

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        checkouts,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request)

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const { name, email, password, student_id, role } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if user exists
    const existingUsers = await sql`
      SELECT id, email, student_id FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `

    if (existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingUser = existingUsers[0]

    // Check email uniqueness if changed
    if (email !== existingUser.email) {
      const duplicateEmails = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId} AND deleted_at IS NULL
      `

      if (duplicateEmails.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    // Check student_id uniqueness if changed
    if (student_id && student_id !== existingUser.student_id) {
      const duplicateStudentIds = await sql`
        SELECT id FROM users WHERE student_id = ${student_id} AND id != ${userId} AND deleted_at IS NULL
      `

      if (duplicateStudentIds.length > 0) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 409 })
      }
    }

    // Prepare update data
    let updateQuery = `
      UPDATE users 
      SET name = $1, email = $2, student_id = $3, role = $4, updated_at = NOW()
    `
    const params = [name, email, student_id || null, role || "user"]

    // Add password to update if provided
    if (password) {
      const hashedPassword = await hashPassword(password)
      updateQuery += `, password = $5`
      params.push(hashedPassword)
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, name, email, role, student_id, created_at, updated_at`
    params.push(userId)

    const updatedUsers = await sql.unsafe(updateQuery, params)
    const user = updatedUsers[0]

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request)

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for active checkouts
    const activeCheckouts = await sql`
      SELECT COUNT(*) as count FROM checkouts 
      WHERE user_id = ${userId} AND status = 'borrowed' AND deleted_at IS NULL
    `

    if (Number.parseInt(activeCheckouts[0].count) > 0) {
      return NextResponse.json({ error: "Cannot delete user with active checkouts" }, { status: 400 })
    }

    // Soft delete
    await sql`
      UPDATE users SET deleted_at = NOW() WHERE id = ${userId}
    `

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
