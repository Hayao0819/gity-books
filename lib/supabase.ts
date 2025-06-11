import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

if (!supabaseServiceKey) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable - some features may not work")
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key if service key is missing
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin.from("books").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Supabase connection test error:", error)
    return false
  }
}
