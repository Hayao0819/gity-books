// Local interface for the hook's transformed book data
export interface Book {
    id: number;
    title: string;
    author: string;
    isbn: string | null;
    publisher: string | null;
    published_year: number | null;
    description: string | null;
    status: "available" | "borrowed";
    created_at: string;
    updated_at: string;
    borrowedBy?: string;
    dueDate?: string;
}

export type BookSummary = Omit<
    Book,
    | "description"
    | "publisher"
    | "published_year"
    | "created_at"
    | "updated_at"
    | "borrowedBy"
    | "dueDate"
    | "status"
>;
