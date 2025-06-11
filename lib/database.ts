import { neon } from "@neondatabase/serverless";

if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is not set");
}

const sql = neon(process.env.POSTGRES_URL);

export { sql };

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    student_id?: string;
    role: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    publisher?: string;
    published_year?: number;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface Checkout {
    id: number;
    book_id: number;
    user_id: number;
    borrowed_date: string;
    due_date: string;
    return_date?: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface CheckoutWithDetails extends Checkout {
    book?: Book;
    user?: User;
}
