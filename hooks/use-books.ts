"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    publisher?: string;
    published_year?: number;
    description?: string;
    status: "available" | "borrowed" | "maintenance";
    created_at: string;
    updated_at: string;
    borrowedBy?: string;
    dueDate?: string;
}

export function useBooks(search = "") {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBooks();
    }, [search]);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Fetching books with search:", search);

            const response = await apiClient.getBooks({
                search: search || undefined,
                page: 1,
                limit: 50, // Get more books for now
            });

            console.log("Books response:", response);

            // Transform the data to match the expected format
            const transformedBooks: Book[] = response.books.map((book) => ({
                id: book.id.toString(),
                title: book.title,
                author: book.author,
                isbn: book.isbn || "",
                publisher: book.publisher,
                published_year: book.published_year,
                description: book.description,
                status: book.status as "available" | "borrowed" | "maintenance",
                created_at: book.created_at,
                updated_at: book.updated_at,
            }));

            console.log("Transformed books:", transformedBooks);
            setBooks(transformedBooks);
        } catch (err) {
            console.error("Error fetching books:", err);
            const errorMessage =
                err instanceof Error ? err.message : "本の取得に失敗しました";
            setError(errorMessage);
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    return { books, loading, error, refetch: fetchBooks };
}
