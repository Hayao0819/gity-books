"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error);
        console.error("Error info:", errorInfo);
        this.setState({ errorInfo });
    }

    reset = () => {
        this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return (
                    <FallbackComponent
                        error={this.state.error!}
                        reset={this.reset}
                    />
                );
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 text-destructive">
                                <AlertCircle className="h-full w-full" />
                            </div>
                            <CardTitle>エラーが発生しました</CardTitle>
                            <CardDescription>
                                アプリケーションでエラーが発生しました。ページを再読み込みしてください。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {this.state.error && (
                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    <strong>エラー詳細:</strong>
                                    <br />
                                    {this.state.error.message}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    onClick={this.reset}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    再試行
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="flex-1"
                                >
                                    ページ再読み込み
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { captureError, resetError };
}
