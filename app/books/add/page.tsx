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
import apiClient from "@/lib/api";

export default function AddBookPage() {
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        published_year: "",
        description: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            // published_yearは数値型に変換
            const payload = {
                title: formData.title,
                author: formData.author,
                isbn: formData.isbn || undefined,
                publisher: formData.publisher || undefined,
                published_year: formData.published_year
                    ? Number(formData.published_year)
                    : undefined,
                description: formData.description || undefined,
            };
            // APIリクエスト
            const res = await apiClient.createBook(payload);
            console.log("Book created:", res);
            setSuccess(true);
            // 本一覧ページへリダイレクト
            router.push("/books");
        } catch (err: any) {
            setError(err?.message || "本の追加に失敗しました");
        } finally {
            setLoading(false);
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
                } catch (err) {
                    // エラー時は何もしない
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
