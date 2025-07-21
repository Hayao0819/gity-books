// チェックアウト（貸出）型定義
export interface Checkout {
    id: number;
    user_id: number;
    book_id: number;
    checkout_date: string;
    due_date: string;
    return_date: string | null;
    status: "borrowed" | "returned";
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
