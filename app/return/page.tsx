"use client";

import { useState, useEffect } from "react";
import { useBorrowedBooks } from "@/hooks/use-borrowed-books";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useRequireLoginRedirect } from "@/hooks/use-auth";
import apiClient from "@/lib/api";

export default function ReturnPage() {
    const [searchTerm, setSearchTerm] = useState("");
    useRequireLoginRedirect();

    // useBorrowedBooksフックでデータ取得
    const { borrowedBooks, dataLoading, error, fetchBorrowedBooks } =
        useBorrowedBooks();

    useEffect(() => {
        fetchBorrowedBooks();
    }, [fetchBorrowedBooks]);

    // 返却処理ボタン
    const [returnLoading, setReturnLoading] = useState<number | null>(null);
    const [returnError, setReturnError] = useState<string | null>(null);
    const handleReturn = async (checkoutId: number) => {
        setReturnLoading(checkoutId);
        setReturnError(null);
        try {
            await apiClient.returnBook(checkoutId);
            await fetchBorrowedBooks();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setReturnError(err.message);
            } else if (typeof err === "string") {
                setReturnError(err);
            } else {
                setReturnError("返却処理に失敗しました");
            }
        } finally {
            setReturnLoading(null);
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

            {dataLoading ? (
                <div className="text-center py-8">貸出中の本を取得中...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
                <>
                    {/* 通信エラーはカードの外に表示 */}
                    {returnError && (
                        <div className="text-center py-2 text-red-500">
                            {returnError}
                        </div>
                    )}
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
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                await handleReturn(book.id);
                                            }}
                                            className="ml-4"
                                            disabled={returnLoading === book.id}
                                        >
                                            {returnLoading === book.id
                                                ? "返却中..."
                                                : "返却処理"}
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
