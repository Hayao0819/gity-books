import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateToken, hashPassword } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, student_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUsers, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)

    if (emailCheckError) {
      console.error('Database error:', emailCheckError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Check if student_id already exists (if provided)
    if (student_id) {
      const { data: existingStudentId, error: studentIdCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('student_id', student_id)
        .is('deleted_at', null)

      if (studentIdCheckError) {
        console.error('Database error:', studentIdCheckError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }

      if (existingStudentId && existingStudentId.length > 0) {
        return NextResponse.json({ error: "Student ID already exists" }, { status: 409 })
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const { data: newUsers, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        student_id: student_id || null,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, name, email, role, student_id, created_at')

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const user = newUsers[0]

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          student_id: user.student_id,
          created_at: user.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
