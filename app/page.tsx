"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Book,
    Plus,
    RotateCcw,
    ShoppingCart,
    TrendingUp,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import apiClient from "@/lib/api";
function HomePage() {
    const [stats, setStats] = useState<{
        total_books: number;
        borrowed_books: number;
        monthly_checkouts: number;
        overdue_books: number;
        total_users: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiClient.getStatsOverview();
                setStats(data);
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message || "統計情報の取得に失敗しました");
                } else {
                    setError("統計情報の取得に失敗しました");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: "総蔵書数", value: stats?.total_books ?? "-", icon: Book },
        {
            title: "貸出中",
            value: stats?.borrowed_books ?? "-",
            icon: ShoppingCart,
        },
        {
            title: "今月の貸出",
            value: stats?.monthly_checkouts ?? "-",
            icon: TrendingUp,
        },
        {
            title: "延滞中",
            value: stats?.overdue_books ?? "-",
            icon: RotateCcw,
        },
        { title: "利用者数", value: stats?.total_users ?? "-", icon: Users },
    ];

    const quickActions = [
        {
            title: "本一覧",
            description: "蔵書を検索・閲覧",
            href: "/books",
            icon: Book,
        },
        {
            title: "本の追加",
            description: "新しい本を登録",
            href: "/books/add",
            icon: Plus,
        },
        {
            title: "貸出処理",
            description: "本の貸出を行う",
            href: "/checkout",
            icon: ShoppingCart,
        },
        {
            title: "返却処理",
            description: "本の返却を行う",
            href: "/return",
            icon: RotateCcw,
        },
    ];

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">図書管理システム</h1>
                    <p className="text-xl text-muted-foreground">
                        読み込み中...
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {statCards.map((c) => (
                        <Card key={c.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-4">
                        クイックアクション
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Card
                                    key={action.title}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardHeader>
                                        <div className="flex items-center space-x-2">
                                            <Icon className="h-5 w-5" />
                                            <CardTitle className="text-lg">
                                                {action.title}
                                            </CardTitle>
                                        </div>
                                        <CardDescription>
                                            {action.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild className="w-full">
                                            <Link href={action.href}>開く</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">図書管理システム</h1>
                    <p className="text-xl text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">図書管理システム</h1>
                <p className="text-xl text-muted-foreground">
                    効率的な図書の貸出・返却管理
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">クイックアクション</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Card
                                key={action.title}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <Icon className="h-5 w-5" />
                                        <CardTitle className="text-lg">
                                            {action.title}
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        {action.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={action.href}>開く</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default HomePage;
