import { useState } from "react";
import apiClient from "@/lib/api";

export function useAddBook() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addBook = async (bookData: {
        title: string;
        author: string;
        isbn: string | null;
        publisher: string | null;
        published_year: number | null;
        description: string | null;
    }) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            // undefinedをnullに変換
            const payload = {
                title: bookData.title,
                author: bookData.author,
                isbn: bookData.isbn ?? null,
                publisher: bookData.publisher ?? null,
                published_year: bookData.published_year ?? null,
                description: bookData.description ?? null,
            };
            const res = await apiClient.createBook(payload);
            setSuccess(true);
            return res;
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === "string") {
                setError(err);
            } else {
                setError("本の追加に失敗しました");
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { addBook, loading, error, success };
}
