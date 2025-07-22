import type {
    CheckoutSummary,
    CheckoutWithUserAndBook,
    CheckoutWithBook,
} from "@/types/checkout";

// Supabaseからのレスポンス型
export type SupabaseCheckoutRecord = {
    id: number;
    book_id: number;
    user_id: number;
    checkout_date: string | null;
    due_date: string;
    return_date: string | null;
    status: string;
    books?: {
        id: number;
        title: string;
        author: string;
        isbn: string | null;
    } | null;
    users?: {
        id: number;
        name: string;
        email: string;
        student_id: string | null;
    } | null;
};

export function transformCheckoutWithUserAndBook(
    checkout: SupabaseCheckoutRecord,
): CheckoutWithUserAndBook {
    return {
        id: checkout.id,
        book_id: checkout.book_id,
        user_id: checkout.user_id,
        checkout_date: checkout.checkout_date ?? "",
        due_date: checkout.due_date ?? "",
        return_date: checkout.return_date ?? null,
        status: checkout.status as CheckoutSummary["status"],
        book: checkout.books
            ? {
                  id: checkout.books.id,
                  title: checkout.books.title,
                  author: checkout.books.author,
                  isbn: checkout.books.isbn ?? null,
              }
            : {
                  id: 0,
                  title: "",
                  author: "",
                  isbn: null,
              },
        user: checkout.users
            ? {
                  id: checkout.users.id,
                  name: checkout.users.name,
                  email: checkout.users.email,
                  student_id: checkout.users.student_id ?? null,
              }
            : null,
    };
}

export function transformCheckoutWithBook(
    checkout: SupabaseCheckoutRecord,
): CheckoutWithBook {
    return {
        id: checkout.id,
        book_id: checkout.book_id,
        user_id: checkout.user_id,
        checkout_date: checkout.checkout_date ?? "",
        due_date: checkout.due_date ?? "",
        return_date: checkout.return_date ?? null,
        status:
            checkout.status === "borrowed" || checkout.status === "returned"
                ? checkout.status
                : "borrowed",
        book: checkout.books
            ? {
                  id: checkout.books.id,
                  title: checkout.books.title,
                  author: checkout.books.author,
                  isbn: checkout.books.isbn ?? null,
              }
            : {
                  id: 0,
                  title: "",
                  author: "",
                  isbn: null,
              },
    };
}
