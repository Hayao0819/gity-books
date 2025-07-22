import type { BookSummary } from "./book";
import type { UserSummary } from "./user";

export interface Checkout {
    id: number;
    book_id: number;
    user_id: number;
    checkout_date: string;
    due_date: string;
    return_date: string | null;
    status: "borrowed" | "returned";
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export type CheckoutSummary = Omit<
    Checkout,
    "created_at" | "updated_at" | "deleted_at"
>;

export type CheckoutWithBook = CheckoutSummary & {
    book: BookSummary | null;
};

export type CheckoutWithUserAndBook = CheckoutWithBook & {
    user: UserSummary | null;
};
