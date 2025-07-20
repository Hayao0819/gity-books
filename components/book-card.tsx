"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Book } from "@/types/book";
import { Calendar, User, Book as LucideBook } from "lucide-react";

interface BookCardProps {
    book: Book;
    onCheckout?: (bookId: string) => void;
    onReturn?: (bookId: string) => void;
}

export function BookCard({ book, onCheckout, onReturn }: BookCardProps) {
    // bookがundefinedまたはnullの場合は何も表示しない
    if (!book) {
        return null;
    }

    return (
        <Card className="w-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between min-h-[56px]">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                    </div>
                    <Badge
                        variant={
                            book.status === "available"
                                ? "default"
                                : "secondary"
                        }
                        className="flex-shrink-0 h-fit self-center"
                    >
                        {book.status === "available" ? "利用可能" : "貸出中"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="mt-auto">
                <div className="space-y-2">
                    <p className="text-sm flex items-center min-h-[32px]">
                        <LucideBook className="h-4 w-4 mr-1" />
                        ISBN: {book.isbn}
                    </p>
                    <p className="text-sm flex items-center min-h-[32px]">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-1">著者:</span>
                        {book.author}
                    </p>
                    {book.status === "borrowed" && book.borrowedBy && (
                        <p className="text-sm text-muted-foreground">
                            借用者: {book.borrowedBy}
                        </p>
                    )}
                    {book.dueDate && (
                        <p className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            返却予定: {book.dueDate}
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="mt-auto">
                {book.status === "available" ? (
                    <Button
                        onClick={() => onCheckout?.(book.id)}
                        className="w-full"
                    >
                        貸出
                    </Button>
                ) : (
                    <Button
                        onClick={() => onReturn?.(book.id)}
                        variant="outline"
                        className="w-full"
                    >
                        返却
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
