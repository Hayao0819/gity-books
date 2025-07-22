import type { Book } from "@/types/book";
// 型変換ユーティリティ: books, book, checkouts, user など

import type { CheckoutSummary } from "@/types/checkout";

type BookWithCheckouts = Book & {
    checkouts?: (CheckoutSummary & {
        users?: { id: number; name: string; email: string };
    })[];
};

export function transformBookWithCheckouts(book: BookWithCheckouts) {
    // 型変換: checkouts配列を整形
    const checkouts = (book.checkouts ?? [])
        .filter((checkout) => checkout.status === "borrowed")
        .map((checkout) => ({
            id: checkout.id,
            book_id: checkout.book_id,
            user_id: checkout.user_id,
            checkout_date: checkout.checkout_date,
            due_date: checkout.due_date,
            return_date: checkout.return_date,
            status: checkout.status,
            user: checkout.users,
        }));
    return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publisher: book.publisher,
        published_year: book.published_year,
        description: book.description,
        status: book.status,
        created_at: book.created_at,
        updated_at: book.updated_at,
        checkouts,
    };
}
