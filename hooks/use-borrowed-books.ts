import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { normalizeCheckoutWithBook } from "@/lib/utils/return-transform";

export type BorrowedBook = {
    id: number;
    title: string;
    author: string;
    isbn: string;
    borrowedBy: string;
    borrowedDate: string;
    dueDate: string;
    isOverdue: boolean;
    returnDate?: string;
};

export function useBorrowedBooks() {
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBorrowedBooks = useCallback(async () => {
        setDataLoading(true);
        setError(null);
        try {
            const me = await apiClient.getMe();
            const userId = me.user.id;
            const res = await apiClient.getUserCheckouts(userId, {
                status: "borrowed",
            });
            setBorrowedBooks(
                (res.checkouts || []).map(normalizeCheckoutWithBook).map(
                    (c): BorrowedBook => ({
                        id: c.id,
                        title: c.book?.title ?? "",
                        author: c.book?.author ?? "",
                        isbn: c.book?.isbn ?? "",
                        borrowedBy: me.user.name,
                        borrowedDate: c.checkout_date
                            ? c.checkout_date.slice(0, 10)
                            : "",
                        dueDate: c.due_date ? c.due_date.slice(0, 10) : "",
                        isOverdue: false,
                        returnDate: c.return_date
                            ? c.return_date.slice(0, 10)
                            : undefined,
                    }),
                ),
            );
        } catch (err: unknown) {
            let errorMsg = "";
            if (typeof err === "object" && err !== null) {
                if (
                    "error" in err &&
                    typeof (err as { error?: unknown }).error === "string"
                ) {
                    errorMsg = (err as { error: string }).error;
                } else if (
                    "message" in err &&
                    typeof (err as { message?: unknown }).message === "string"
                ) {
                    errorMsg = (err as { message: string }).message;
                }
            }
            setError(errorMsg || "貸出中の本の取得に失敗しました");
            setBorrowedBooks([]);
        } finally {
            setDataLoading(false);
        }
    }, []);

    return { borrowedBooks, dataLoading, error, fetchBorrowedBooks };
}
