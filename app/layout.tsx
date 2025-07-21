import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "図書館管理システム",
    description: "図書館の本の貸出・返却を管理するシステム",
    generator: "v0.dev",
};

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="ja">
            <ErrorBoundary>
                <SessionProvider>
                    <body
                        className={`${inter.className} bg-white flex flex-col min-h-screen`}
                    >
                        <Navigation />
                        <main className="container mx-auto px-4 py-8 max-w-7xl grow">
                            {children}
                        </main>
                    </body>
                </SessionProvider>
            </ErrorBoundary>
        </html>
    );
}
