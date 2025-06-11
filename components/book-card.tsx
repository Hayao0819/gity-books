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
import { Book, Calendar, User } from "lucide-react";

interface BookCardProps {
    book: {
        id: string;
        title: string;
        author: string;
        isbn: string;
        status: "available" | "borrowed";
        borrowedBy?: string;
        dueDate?: string;
    };
    onCheckout?: (bookId: string) => void;
    onReturn?: (bookId: string) => void;
}

export function BookCard({ book, onCheckout, onReturn }: BookCardProps) {
    // bookがundefinedまたはnullの場合は何も表示しない
    if (!book) {
        return null;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {book.author}
                        </p>
                    </div>
                    <Badge
                        variant={
                            book.status === "available"
                                ? "default"
                                : "secondary"
                        }
                    >
                        {book.status === "available" ? "利用可能" : "貸出中"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm flex items-center">
                        <Book className="h-4 w-4 mr-1" />
                        ISBN: {book.isbn}
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
            <CardFooter>
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
