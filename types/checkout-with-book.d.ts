// APIの返り値型に合わせたチェックアウト＋本情報の型
declare module "@/types/checkout-with-book" {
    export interface CheckoutWithBook {
        id: number;
        book_id: number;
        user_id: number;
        checkout_date: string;
        due_date: string;
        return_date?: string;
        status: string;
        book?: {
            id: number;
            title: string;
            author: string;
            isbn: string;
        };
    }
}
