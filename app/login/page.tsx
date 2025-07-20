"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await login();
        } catch (err) {
            setError("ログイン処理中にエラーが発生しました");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        ログイン
                    </CardTitle>
                    <CardDescription className="text-center">
                        図書管理システムにアクセスするためにログインしてください
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button
                        type="button"
                        className="w-full"
                        disabled={isLoading}
                        onClick={handleLogin}
                    >
                        {isLoading ? "ログイン中..." : "ログイン"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
