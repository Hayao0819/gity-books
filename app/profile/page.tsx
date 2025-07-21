"use client";

// import type {   } from "@/types/checkout-with-book";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";
import { apiClient } from "@/lib/api";
import type { CheckoutWithBook as CheckoutWithBookResponse } from "@/types/checkout";

// APIレスポンスをCheckoutWithBookResponse型に正規化
function normalizeCheckoutWithBook(obj: unknown): CheckoutWithBookResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    return {
        id: o.id,
        book_id: o.book_id,
        user_id: o.user_id,
        checkout_date: o.checkout_date,
        due_date: o.due_date,
        return_date: o.return_date ?? null,
        status: o.status as CheckoutWithBookResponse["status"],
        book: o.book
            ? {
                  id: o.book.id,
                  title: o.book.title,
                  author: o.book.author,
                  isbn: o.book.isbn ?? null,
              }
            : {
                  id: 0,
                  title: "",
                  author: "",
                  isbn: null,
              },
    };
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [borrowed, setBorrowed] = useState<CheckoutWithBookResponse[]>([]);
    const [history, setHistory] = useState<CheckoutWithBookResponse[]>([]);
    const [loadingBooks, setLoadingBooks] = useState(true);

    useEffect(() => {
        async function fetchUserAndBooks() {
            try {
                setLoading(true);
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });
                if (!res.ok)
                    throw new Error("ユーザー情報の取得に失敗しました");
                const data = await res.json();
                setUser(data.user ?? null);

                if (data.user) {
                    setLoadingBooks(true);
                    // 現在借りている本
                    const borrowedRes = await apiClient.getCheckouts({
                        user_id: data.user.id,
                        status: "borrowed",
                        limit: 20,
                    });
                    setBorrowed(
                        (borrowedRes.checkouts || []).map(
                            normalizeCheckoutWithBook,
                        ),
                    );
                    // 過去の履歴
                    const historyRes = await apiClient.getCheckouts({
                        user_id: data.user.id,
                        status: "returned",
                        limit: 20,
                    });
                    setHistory(
                        (historyRes.checkouts || []).map(
                            normalizeCheckoutWithBook,
                        ),
                    );
                }
            } catch (_) {
                setUser(null);
            } finally {
                setLoading(false);
                setLoadingBooks(false);
            }
        }
        fetchUserAndBooks();
    }, []);

    if (loading) return <div>読み込み中...</div>;
    if (!user) return <div>ユーザー情報が取得できませんでした。</div>;

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">プロフィール</h1>
            <div className="mb-2">
                <span className="font-semibold">ユーザーID:</span> {user.id}
            </div>

            <div className="mb-2">
                <span className="font-semibold">ユーザー名:</span>{" "}
                {user.name || user.email}
            </div>
            <div className="mb-2">
                <span className="font-semibold">メールアドレス:</span>{" "}
                {user.email}
            </div>
            <div className="mb-2">
                <span className="font-semibold">ロール:</span> {user.role}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">現在借りている本</h2>
                {loadingBooks ? (
                    <div>読み込み中...</div>
                ) : borrowed.length === 0 ? (
                    <div>現在借りている本はありません。</div>
                ) : (
                    <ul className="space-y-2">
                        {borrowed.map((c) => (
                            <li key={c.id} className="border rounded p-3">
                                <div className="font-bold">{c.book?.title}</div>
                                <div className="text-sm text-gray-600">
                                    著者: {c.book?.author}
                                </div>
                                <div className="text-sm">
                                    貸出日: {c.checkout_date?.slice(0, 10)}
                                </div>
                                <div className="text-sm">
                                    返却予定: {c.due_date?.slice(0, 10)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">過去の貸出履歴</h2>
                {loadingBooks ? (
                    <div>読み込み中...</div>
                ) : history.length === 0 ? (
                    <div>過去の貸出履歴はありません。</div>
                ) : (
                    <ul className="space-y-2">
                        {history.map((c) => (
                            <li key={c.id} className="border rounded p-3">
                                <div className="font-bold">{c.book?.title}</div>
                                <div className="text-sm text-gray-600">
                                    著者: {c.book?.author}
                                </div>
                                <div className="text-sm">
                                    貸出日: {c.checkout_date?.slice(0, 10)}
                                </div>
                                <div className="text-sm">
                                    返却日: {c.return_date?.slice(0, 10) || "-"}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
