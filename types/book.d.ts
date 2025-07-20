// Book型定義
export interface Book {
    id: number;
    title: string;
    author: string;
    isbn: string | null;
    publisher: string | null;
    published_year: number | null;
    description: string | null;
    status: "available" | "checked_out" | "reserved" | "maintenance";
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
