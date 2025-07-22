import { useEffect, useState } from "react";
import type { User } from "@/types/user";
import { apiClient } from "@/lib/api";
import { normalizeCheckoutWithBook } from "@/lib/utils/return-transform";
import type { CheckoutWithBook } from "@/types/checkout";

interface ProfileData {
    user: User | null;
    borrowed: CheckoutWithBook[];
    history: CheckoutWithBook[];
    loading: boolean;
    loadingBooks: boolean;
}

export function useProfileData(): ProfileData {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [borrowed, setBorrowed] = useState<CheckoutWithBook[]>([]);
    const [history, setHistory] = useState<CheckoutWithBook[]>([]);
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

    return { user, borrowed, history, loading, loadingBooks };
}
