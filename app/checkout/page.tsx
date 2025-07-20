"use client";

import { useState } from "react";
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

export default function CheckoutPage() {
    const [bookSearch, setBookSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // モックデータ
    const availableBooks = [
        {
            id: "1",
            title: "JavaScript入門",
            author: "田中太郎",
            isbn: "978-4-123456-78-9",
        },
        {
            id: "3",
            title: "Go言語プログラミング",
            author: "鈴木一郎",
            isbn: "978-4-555666-77-8",
        },
    ];

    const users = [
        {
            id: "1",
            name: "山田太郎",
            email: "yamada@example.com",
            studentId: "S001",
        },
        {
            id: "2",
            name: "佐藤花子",
            email: "sato@example.com",
            studentId: "S002",
        },
    ];

    const handleCheckout = () => {
        if (selectedBook && selectedUser) {
            // 実際はGoバックエンドのAPIを呼び出し
            console.log("Checkout:", {
                book: selectedBook,
                user: selectedUser,
            });
            // 成功時はリセット
            setSelectedBook(null);
            setSelectedUser(null);
            setBookSearch("");
            setUserSearch("");
        }
    };

    const filteredBooks = availableBooks.filter(
        (book) =>
            book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
            book.isbn.includes(bookSearch),
    );

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.studentId.toLowerCase().includes(userSearch.toLowerCase()),
    );

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
                            {filteredBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className={`p-3 border rounded cursor-pointer transition-colors ${
                                        selectedBook?.id === book.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    }`}
                                    // tabIndex={0}
                                    onClick={() => setSelectedBook(book)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
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
                            ))}
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
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`p-3 border rounded cursor-pointer transition-colors ${
                                        selectedUser?.id === user.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    }`}
                                    // tabIndex={0}
                                    onClick={() => setSelectedUser(user)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
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
                                    <div className="text-xs opacity-50">
                                        学籍番号: {user.studentId}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedBook && selectedUser && (
                <Card>
                    <CardHeader>
                        <CardTitle>貸出確認</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium">
                                    選択された本
                                </Label>
                                <div className="p-3 bg-muted rounded">
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
                                <div className="p-3 bg-muted rounded">
                                    <div className="font-medium">
                                        {selectedUser.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedUser.studentId}
                                    </div>
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
