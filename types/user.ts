// Supabaseのusersテーブルに準拠したユーザー情報型
export interface User {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
    student_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export type UserSummary = Omit<
    User,
    "created_at" | "updated_at" | "deleted_at" | "role"
>;
