"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Book,
    Home,
    LogOut,
    Plus,
    RotateCcw,
    ShoppingCart,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function Navigation() {
    const pathname = usePathname();
    const { user, logout, loading, authenticated } = useAuth();

    const navItems = [
        { href: "/", label: "ホーム", icon: Home },
        { href: "/books", label: "本一覧", icon: Book },
        {
            href: "/books/add",
            label: "本の追加",
            icon: Plus,
            requireAuth: true,
        },
        {
            href: "/checkout",
            label: "貸出",
            icon: ShoppingCart,
            requireAuth: true,
        },
        { href: "/return", label: "返却", icon: RotateCcw, requireAuth: true },
    ];

    const handleLogout = async () => {
        await logout();
    };
    const { data: session, status } = useSession();

    useEffect(() => {
        console.log("session:", session);
        console.log("status:", status);
    }, [session, status]);

    if (loading) {
        return (
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Book className="h-6 w-6" />
                            <span className="font-bold text-xl">
                                図書管理システム
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            読み込み中...
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Book className="h-6 w-6" />
                        <span className="font-bold text-xl">
                            図書管理システム
                        </span>
                    </Link>

                    <div className="flex items-center space-x-1">
                        {navItems.map((item) => {
                            // Hide auth-required items if not logged in
                            if (item.requireAuth && !user) {
                                return null;
                            }

                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant={
                                        pathname === item.href
                                            ? "default"
                                            : "ghost"
                                    }
                                    size="sm"
                                    asChild
                                >
                                    <Link
                                        href={item.href}
                                        className="flex items-center space-x-2"
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            {item.label}
                                        </span>
                                    </Link>
                                </Button>
                            );
                        })}

                        {authenticated && user ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-2"
                                    asChild
                                >
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-2"
                                    >
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            {user.name}
                                        </span>
                                        {/* {user.role === "admin" && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1"
                                            >
                                                管理者
                                            </Badge>
                                        )} */}
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        ログアウト
                                    </span>
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </nav>
    );
}
