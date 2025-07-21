"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });
                if (!res.ok)
                    throw new Error("ユーザー情報の取得に失敗しました");
                const data = await res.json();
                setUser(data.user ?? null);
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
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
                {user.name || user.preferred_username || user.email}
            </div>
            <div className="mb-2">
                <span className="font-semibold">メールアドレス:</span>{" "}
                {user.email}
            </div>
            <div className="mb-2">
                <span className="font-semibold">ロール:</span> {user.role}
            </div>
        </div>
    );
}
