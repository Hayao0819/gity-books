import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { hashPassword } from "@/lib/jwt"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request)

    const userId = Number.parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, name, email, role, student_id, created_at, updated_at,
        checkouts(
          id, book_id, borrowed_date, due_date, return_date, status,
          books(id, title, author, isbn)
        )
      `)
      .eq('id', userId)
      .is('deleted_at', null)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Format checkouts
    const checkouts = (user.checkouts || []).map((checkout: any) => ({
      id: checkout.id,
      book_id: checkout.book_id,
      borrowed_date: checkout.borrowed_date,
      due_date: checkout.due_date,
      return_date: checkout.return_date,
      status: checkout.status,
      book: checkout.books,
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
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, student_id')
      .eq('id', userId)
      .is('deleted_at', null)

    if (checkError) {
      console.error('Database error:', checkError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingUser = existingUsers[0]

    // Check email uniqueness if changed
    if (email !== existingUser.email) {
      const { data: duplicateEmails, error: emailError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .is('deleted_at', null)

      if (emailError) {
        console.error('Database error:', emailError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }

      if (duplicateEmails && duplicateEmails.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    // Check student_id uniqueness if changed
    if (student_id && student_id !== existingUser.student_id) {
      const { data: duplicateStudentIds, error: studentIdError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('student_id', student_id)
        .neq('id', userId)
        .is('deleted_at', null)

      if (studentIdError) {
        console.error('Database error:', studentIdError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }

      if (duplicateStudentIds && duplicateStudentIds.length > 0) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      student_id: student_id || null,
      role: role || "user",
      updated_at: new Date().toISOString()
    }

    // Add password to update if provided
    if (password) {
      const hashedPassword = await hashPassword(password)
      updateData.password = hashedPassword
    }

    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, role, student_id, created_at, updated_at')

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

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
    const { data: users, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .is('deleted_at', null)

    if (checkError) {
      console.error('Database error:', checkError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for active checkouts
    const { data: activeCheckouts, error: checkoutError } = await supabaseAdmin
      .from('checkouts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'borrowed')
      .is('deleted_at', null)

    if (checkoutError) {
      console.error('Database error:', checkoutError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (activeCheckouts && activeCheckouts.length > 0) {
      return NextResponse.json({ error: "Cannot delete user with active checkouts" }, { status: 400 })
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    if (error instanceof Error && (error.message.includes("token") || error.message.includes("Admin"))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Admin") ? 403 : 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
