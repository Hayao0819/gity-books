"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "./useSearchParams";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBooks } from "@/hooks/use-books";
import type { Book } from "@/types/book";

import { apiClient } from "@/lib/api";
import type { User } from "@/types/user";

export default function CheckoutPage() {
    const [bookSearch, setBookSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const { books, loading: booksLoading } = useBooks(bookSearch);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    // book_idパラメータがあれば初期選択
    useEffect(() => {
        const bookIdParam = searchParams.get("book_id");
        if (bookIdParam && books.length > 0) {
            const found = books.find(
                (b) => String(b.id) === String(bookIdParam),
            );
            if (found) setSelectedBook(found);
        }
    }, [searchParams, books]);

    useEffect(() => {
        const fetchUsers = async () => {
            setUsersLoading(true);
            setUsersError(null);
            try {
                const res = await apiClient.getUsers();
                console.log("Users response:", res);
                setUsers(
                    res.users.map((u) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role === "admin" ? "admin" : "user",
                        student_id: u.student_id ?? null,
                        created_at: u.created_at,
                        updated_at: u.updated_at,
                        deleted_at: null,
                    })),
                );
            } catch (err) {
                setUsersError(
                    err instanceof Error
                        ? err.message
                        : "利用者の取得に失敗しました",
                );
                setUsers([]);
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleCheckout = async () => {
        if (selectedBook && selectedUser) {
            try {
                // API呼び出し
                await apiClient.createCheckout({
                    book_id: Number(selectedBook.id),
                    user_id: Number(selectedUser.id),
                });
                // 成功時はリセット
                setSelectedBook(null);
                setSelectedUser(null);
                setBookSearch("");
                setUserSearch("");
                alert("貸出が完了しました");
            } catch (err: unknown) {
                if (typeof err === "object" && err !== null) {
                    let errorMsg = "";
                    if (
                        "error" in err &&
                        typeof (err as { error?: unknown }).error === "string"
                    ) {
                        errorMsg = (err as { error: string }).error;
                    } else if (
                        "message" in err &&
                        typeof (err as { message?: unknown }).message ===
                            "string"
                    ) {
                        errorMsg = (err as { message: string }).message;
                    }
                    alert(errorMsg || "貸出処理に失敗しました");
                } else {
                    alert("貸出処理に失敗しました");
                }
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">貸出処理</h1>
                <p className="text-muted-foreground">本の貸出を行います</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>本を選択</CardTitle>
                        <CardDescription>
                            貸出する本を検索して選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="タイトルまたはISBNで検索..."
                                value={bookSearch}
                                onChange={(e) => setBookSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {booksLoading ? (
                                <div>本を取得中...</div>
                            ) : books.length === 0 ? (
                                <div>該当する本がありません</div>
                            ) : (
                                books.map((book) => (
                                    <div
                                        key={book.id}
                                        className={`p-3 border rounded cursor-pointer transition-colors ${
                                            selectedBook?.id === book.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        }`}
                                        onClick={() => setSelectedBook(book)}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                setSelectedBook(book);
                                            }
                                        }}
                                    >
                                        <div className="font-medium">
                                            {book.title}
                                        </div>
                                        <div className="text-sm opacity-70">
                                            {book.author}
                                        </div>
                                        <div className="text-xs opacity-50">
                                            {book.isbn}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>利用者を選択</CardTitle>
                        <CardDescription>
                            貸出先の利用者を検索して選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="名前または学籍番号で検索..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {usersLoading ? (
                                <div>利用者を取得中...</div>
                            ) : usersError ? (
                                <div className="text-red-500">{usersError}</div>
                            ) : users.length === 0 ? (
                                <div>該当する利用者がいません</div>
                            ) : (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`p-3 border rounded cursor-pointer transition-colors ${
                                            selectedUser?.id === user.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        }`}
                                        onClick={() => setSelectedUser(user)}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                setSelectedUser(user);
                                            }
                                        }}
                                    >
                                        <div className="font-medium">
                                            {user.name}
                                        </div>
                                        <div className="text-sm opacity-70">
                                            {user.email}
                                        </div>
                                        {/* <div className="text-xs opacity-50">
                                            学籍番号: {user.studentId}
                                        </div> */}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedBook && selectedUser && (
                <Card>
                    <CardHeader>
                        <CardTitle>貸出確認</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 min-h-60">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium">
                                    選択された本
                                </Label>
                                <div className="p-3 bg-muted rounded h-20 flex flex-col justify-center">
                                    <div className="font-medium">
                                        {selectedBook.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedBook.author}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">
                                    貸出先
                                </Label>
                                <div className="p-3 bg-muted rounded h-20 flex flex-col justify-center">
                                    <div className="font-medium">
                                        {selectedUser.name}
                                    </div>
                                    {/* <div className="text-sm text-muted-foreground">
                                        {selectedUser.studentId}
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleCheckout} className="w-full">
                            貸出を実行
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
