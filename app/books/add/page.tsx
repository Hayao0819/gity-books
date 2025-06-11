"use client";

import type React from "react";

import { useState } from "react";
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

export default function AddBookPage() {
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        publishedYear: "",
        description: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 実際はGoバックエンドのAPIを呼び出し
        console.log("Add book:", formData);
        // 成功時は本一覧ページにリダイレクト
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
                                    value={formData.isbn}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publisher">出版社</Label>
                                <Input
                                    id="publisher"
                                    name="publisher"
                                    value={formData.publisher}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="publishedYear">出版年</Label>
                            <Input
                                id="publishedYear"
                                name="publishedYear"
                                type="number"
                                placeholder="2024"
                                value={formData.publishedYear}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">説明</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="本の内容や特徴を入力してください"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                本を追加
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
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
