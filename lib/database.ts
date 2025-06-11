import { createClient } from "@supabase/supabase-js"

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")
}

// Server-side Supabase client with service role key
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface User {
  id: number
  name: string
  email: string
  password: string
  student_id?: string
  role: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  publisher?: string
  published_year?: number
  description?: string
  status: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Checkout {
  id: number
  book_id: number
  user_id: number
  borrowed_date: string
  due_date: string
  return_date?: string
  status: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CheckoutWithDetails extends Checkout {
  book?: Book
  user?: User
}
