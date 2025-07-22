"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { useAddBook } from "@/hooks/use-add-book";
export default function AddBookPage() {
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        published_year: "",
        description: "",
    });
    const router = useRouter();
    const { addBook, loading, error, success } = useAddBook();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title: formData.title,
                author: formData.author,
                isbn: formData.isbn || null,
                publisher: formData.publisher || null,
                published_year: formData.published_year
                    ? Number(formData.published_year)
                    : null,
                description: formData.description || null,
            };
            await addBook(payload);
            router.push("/books");
        } catch {
            // errorはフックで管理
        }
    };

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // ISBN自動取得
        if (name === "isbn") {
            const isbn = value.replace(/-/g, "");
            if (isbn.length === 10 || isbn.length === 13) {
                try {
                    const res = await fetch(
                        `https://api.openbd.jp/v1/get?isbn=${isbn}`,
                    );
                    const data = await res.json();
                    if (data?.[0]?.summary) {
                        setFormData((prev) => ({
                            ...prev,
                            title: data[0].summary.title || prev.title,
                            author: data[0].summary.author || prev.author,
                            publisher:
                                data[0].summary.publisher || prev.publisher,
                            published_year:
                                data[0].summary.pubdate?.slice(0, 4) ||
                                prev.published_year,
                        }));
                    }
                } catch (error) {
                    // エラー時は何もしない
                    console.error("ISBN fetch error:", error);
                }
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">新しい本を追加</CardTitle>
                    <CardDescription>
                        図書館に新しい本を登録します
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">タイトル *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">著者 *</Label>
                                <Input
                                    id="author"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="isbn">ISBN</Label>
                                <Input
                                    id="isbn"
                                    name="isbn"
                                    placeholder="978-4-123456-78-9"
                                    value={formData.isbn ?? ""}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publisher">出版社</Label>
                                <Input
                                    id="publisher"
                                    name="publisher"
                                    value={formData.publisher ?? ""}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="published_year">出版年</Label>
                            <Input
                                id="published_year"
                                name="published_year"
                                type="number"
                                placeholder="2024"
                                value={formData.published_year}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">説明</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="本の内容や特徴を入力してください"
                                value={formData.description || ""}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm">{error}</div>
                        )}
                        {success && (
                            <div className="text-green-600 text-sm">
                                本を追加しました。リダイレクト中...
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? "追加中..." : "本を追加"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => router.push("/books")}
                            >
                                キャンセル
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
