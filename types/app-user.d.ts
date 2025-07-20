// アプリケーション固有のユーザー情報型（Supabase保存用）
export interface AppUser {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
    student_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
