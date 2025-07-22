import type { CheckoutWithBook } from "@/types/checkout";

export function normalizeCheckoutWithBook(
    obj: CheckoutWithBook,
): CheckoutWithBook {
    return {
        id: obj.id,
        book_id: obj.book_id,
        user_id: obj.user_id,
        checkout_date: obj.checkout_date ?? "",
        due_date: obj.due_date ?? "",
        return_date: obj.return_date !== undefined ? obj.return_date : null,
        status:
            obj.status === "borrowed" || obj.status === "returned"
                ? obj.status
                : "borrowed",
        book: obj.book
            ? {
                  id: obj.book.id,
                  title: obj.book.title,
                  author: obj.book.author,
                  isbn: obj.book.isbn ?? null,
              }
            : {
                  id: 0,
                  title: "",
                  author: "",
                  isbn: null,
              },
    };
}
