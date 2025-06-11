import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          name: string
          email: string
          password_hash: string
          role: string
          student_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          name: string
          email: string
          password_hash: string
          role?: string
          student_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          name?: string
          email?: string
          password_hash?: string
          role?: string
          student_id?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
      }
      books: {
        Row: {
          id: number
          title: string
          author: string
          isbn: string | null
          publisher: string | null
          published_year: number | null
          description: string | null
          status: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          title: string
          author: string
          isbn?: string | null
          publisher?: string | null
          published_year?: number | null
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          title?: string
          author?: string
          isbn?: string | null
          publisher?: string | null
          published_year?: number | null
          description?: string | null
          status?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      checkouts: {
        Row: {
          id: number
          user_id: number
          book_id: number
          checkout_date: string
          due_date: string
          return_date: string | null
          status: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          user_id: number
          book_id: number
          checkout_date?: string
          due_date: string
          return_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          return_date?: string | null
          status?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
  }
}
