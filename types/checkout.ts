export interface CheckoutRecord {
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

export type Checkout = Omit<
    CheckoutRecord,
    "created_at" | "updated_at" | "deleted_at"
>;

// export interface CheckoutWithBookResponse {
//     id: number;
//     book_id: number;
//     user_id: number;
//     checkout_date: string;
//     due_date: string;
//     return_date: string | null;
//     status: "borrowed" | "returned" | "overdue" | "active";
//     book: {
//         id: number;
//         title: string;
//         author: string;
//         isbn: string | null;
//     };
// }

export type CheckoutWithBook = Checkout & {
    book: {
        id: number;
        title: string;
        author: string;
        isbn: string | null;
    };
};

// export type SupabaseCheckoutRecord = CheckoutRecord & {
//     books?: {
//         id: number;
//         title: string;
//         author: string;
//         isbn: string | null;
//     } | null;
//     users?: {
//         id: number;
//         name: string;
//         email: string;
//         student_id: string | null;
//     } | null;
// };
