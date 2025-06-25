import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required",
    );
}

// Server-side Supabase client with service role key
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    },
);

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    student_id?: string | null;
    role: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string | null;
    publisher?: string | null;
    published_year?: number | null;
    description?: string | null;
    status: "available" | "borrowed" | "maintenance";
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface Checkout {
    id: number;
    book_id: number;
    user_id: number;
    borrowed_date: string;
    due_date: string;
    return_date?: string | null;
    status: "borrowed" | "returned" | "overdue";
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface BookDetails {
    id: number;
    title: string;
    author: string;
    isbn: string | null;
}

export interface UserDetails {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
}

export interface CheckoutWithDetails extends Checkout {
    book?: BookDetails;
    user?: UserDetails;
}

// Supabaseのレスポンス型
export interface SupabaseResponse<T> {
    data: T | null;
    error: Error | null;
    count?: number;
    status: number;
    statusText: string;
}

// ページネーション情報の型
export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// APIレスポンスの型
export interface ApiResponse<T> {
    data: T;
    pagination?: PaginationInfo;
    error?: string;
}
