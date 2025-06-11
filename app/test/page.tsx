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
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
    success: boolean;
    data?: any;
    error?: string;
}

export default function TestPage() {
    const [healthResult, setHealthResult] = useState<TestResult | null>(null);
    const [booksResult, setBooksResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState<{ health: boolean; books: boolean }>(
        {
            health: false,
            books: false,
        },
    );

    const testHealth = async () => {
        setLoading((prev) => ({ ...prev, health: true }));
        try {
            const response = await fetch("/api/health", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }

            const data = await response.json();
            setHealthResult({ success: true, data });
        } catch (error) {
            setHealthResult({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setLoading((prev) => ({ ...prev, health: false }));
        }
    };

    const testBooks = async () => {
        setLoading((prev) => ({ ...prev, books: true }));
        try {
            const response = await fetch("/api/books", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }

            const data = await response.json();
            setBooksResult({ success: true, data });
        } catch (error) {
            setBooksResult({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setLoading((prev) => ({ ...prev, books: false }));
        }
    };

    const ResultCard = ({
        title,
        result,
        loading,
    }: { title: string; result: TestResult | null; loading: boolean }) => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {result?.success === true && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {result?.success === false && (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {!result && (
                        <AlertCircle className="h-5 w-5 text-gray-500" />
                    )}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <p>テスト中...</p>}
                {result && !loading && (
                    <div className="space-y-2">
                        {result.success ? (
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>成功</AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {result.error}
                                </AlertDescription>
                            </Alert>
                        )}
                        <details className="mt-4">
                            <summary className="cursor-pointer font-medium">
                                詳細を表示
                            </summary>
                            <pre className="mt-2 bg-muted p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(
                                    result.data || result.error,
                                    null,
                                    2,
                                )}
                            </pre>
                        </details>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>システムテスト</CardTitle>
                    <CardDescription>
                        各APIエンドポイントの動作確認
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button onClick={testHealth} disabled={loading.health}>
                            {loading.health ? "テスト中..." : "ヘルスチェック"}
                        </Button>
                        <Button onClick={testBooks} disabled={loading.books}>
                            {loading.books ? "テスト中..." : "本API"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <ResultCard
                    title="ヘルスチェック"
                    result={healthResult}
                    loading={loading.health}
                />
                <ResultCard
                    title="本API"
                    result={booksResult}
                    loading={loading.books}
                />
            </div>
        </div>
    );
}
