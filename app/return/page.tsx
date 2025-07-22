"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { normalizeCheckoutWithBook } from "@/lib/utils/return-transform";

// 返却画面用の貸出中本型
type BorrowedBook = {
    id: string; // チェックアウトID
    title: string;
    author: string;
    isbn: string;
    borrowedBy: string;
    borrowedDate: string;
    dueDate: string;
    isOverdue: boolean;
    returnDate?: string;
};

export default function ReturnPage() {
    const [searchTerm, setSearchTerm] = useState("");

    // 実データ取得用の状態
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ログインユーザーのID取得（簡易実装: /api/auth/me で取得）
    // fetchBorrowedBooksをuseEffect外に出す

    const fetchBorrowedBooks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // まず自分のユーザーIDを取得
            const me = await apiClient.getMe();
            const userId = me.user.id;
            // 自分の貸出中の本一覧を取得
            const res = await apiClient.getUserCheckouts(userId, {
                status: "borrowed",
            });
            setBorrowedBooks(
                (res.checkouts || []).map(normalizeCheckoutWithBook).map(
                    (c): BorrowedBook => ({
                        id: String(c.id),
                        title: c.book?.title ?? "",
                        author: c.book?.author ?? "",
                        isbn: c.book?.isbn ?? "",
                        borrowedBy: me.user.name,
                        borrowedDate: c.checkout_date
                            ? c.checkout_date.slice(0, 10)
                            : "",
                        dueDate: c.due_date ? c.due_date.slice(0, 10) : "",
                        isOverdue: false, // c.statusが"overdue"はAPI側で返さないためfalse固定
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
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBorrowedBooks();
    }, [fetchBorrowedBooks]);

    // 返却処理ボタン
    const handleReturn = async (checkoutId: string) => {
        setLoading(true);
        setError(null);
        try {
            // API呼び出し
            await apiClient.returnBook(Number(checkoutId));
            // 返却後に一覧を再取得
            await fetchBorrowedBooks();
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
            setError(errorMsg || "返却処理に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const filteredBooks = borrowedBooks.filter(
        (book) =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.borrowedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.isbn.includes(searchTerm),
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">返却処理</h1>
                <p className="text-muted-foreground">
                    貸出中の本の返却を行います
                </p>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="タイトル、借用者、ISBNで検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">貸出中の本を取得中...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
                <>
                    <div className="space-y-4">
                        {filteredBooks.map((book) => (
                            <Card key={book.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-semibold">
                                                    {book.title}
                                                </h3>
                                                {book.isOverdue && (
                                                    <Badge variant="destructive">
                                                        延滞中
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground">
                                                著者: {book.author}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                ISBN: {book.isbn}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <span className="font-medium">
                                                        借用者:
                                                    </span>{" "}
                                                    {book.borrowedBy}
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        貸出日:
                                                    </span>{" "}
                                                    {book.borrowedDate}
                                                </div>
                                                <div
                                                    className={
                                                        book.isOverdue
                                                            ? "text-red-600 font-medium"
                                                            : ""
                                                    }
                                                >
                                                    <span className="font-medium">
                                                        返却予定日:
                                                    </span>{" "}
                                                    {book.dueDate}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                handleReturn(book.id)
                                            }
                                            className="ml-4"
                                        >
                                            返却処理
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredBooks.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? "検索条件に一致する貸出中の本が見つかりません。"
                                    : "現在貸出中の本はありません。"}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
