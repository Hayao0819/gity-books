"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
    const { register, loading, error } = useAuth();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        student_id: "",
    });
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        const res = await register(form);
        if (res.success) {
            setSuccess(true);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">アカウント新規作成</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="register-name" className="block mb-1">名前</label>
                    <input
                        id="register-name"
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label htmlFor="register-email" className="block mb-1">メールアドレス</label>
                    <input
                        id="register-email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label htmlFor="register-password" className="block mb-1">パスワード</label>
                    <input
                        id="register-password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label htmlFor="register-student-id" className="block mb-1">学籍番号（任意）</label>
                    <input
                        id="register-student-id"
                        type="text"
                        name="student_id"
                        value={form.student_id}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "登録中..." : "新規登録"}
                </button>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                {success && <div className="text-green-600 text-sm mt-2">登録が完了しました！</div>}
            </form>
        </div>
    );
}
