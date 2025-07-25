"use client";

import { useRequireLoginRedirect } from "@/hooks/use-auth";

import { useProfileData } from "@/hooks/use-profile-data";

export default function ProfilePage() {
    const { user, borrowed, history, loading, loadingBooks } = useProfileData();

    useRequireLoginRedirect();
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
