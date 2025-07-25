"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

// SuspenseでラップしてuseSearchParamsを使うコンポーネント
function RequiredFlag({ setRequired }: { setRequired: (v: boolean) => void }) {
    const params = useSearchParams();
    useEffect(() => {
        setRequired(params.get("required") === "true");
    }, [params, setRequired]);
    return null;
}

function RedirectFlag({ handleLogin }: { handleLogin: () => void }) {
    const params = useSearchParams();
    useEffect(() => {
        if (params.get("redirect") === "true") {
            handleLogin();
        }
    }, [params, handleLogin]);
    return null;
}

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, authenticated, loading } = useAuth();
    const [redirected, setRedirected] = useState(false);
    const [required, setRequired] = useState(false);

    const handleLogin = useCallback(async () => {
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
    }, [login]);

    useEffect(() => {
        if (authenticated && !loading && !redirected) {
            window.location.replace("/");
            setRedirected(true);
        }
    }, [authenticated, loading, redirected]);

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Suspense fallback={null}>
                <RequiredFlag setRequired={setRequired} />
                <RedirectFlag handleLogin={handleLogin} />
            </Suspense>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        {required ? "ログインが必要です" : "ログイン"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {required ? (
                            <>
                                このページを表示するにはログインが必要です。
                                <br />
                                お手数ですが、ログインしてください。
                            </>
                        ) : (
                            "図書管理システムにアクセスするためにログインしてください"
                        )}
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
