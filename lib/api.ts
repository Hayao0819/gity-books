import type { AppUser } from "@/types/app-user";
import type { Book } from "@/types/book";
import type {
    CheckoutSummary,
    CheckoutWithBook,
    CheckoutWithUserAndBook,
} from "@/types/checkout";
import type { User } from "@/types/user";

const API_BASE_URL = "";

class ApiClient {
    private baseURL: string;
    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = new Headers(options.headers);
        headers.set("Content-Type", "application/json");
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || `HTTP error! status: ${response.status}`,
            );
        }
        return response.json();
    }

    // 認証・ユーザー情報
    async getMe() {
        return this.request<{ user: AppUser }>("/api/auth/me");
    }

    // 図書一覧・詳細・追加・更新・削除・状態変更
    async getBooks(params?: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());
        const query = searchParams.toString();
        return this.request<{
            books: Book[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/books${query ? `?${query}` : ""}`);
    }
    async getBook(id: number) {
        return this.request<{ book: Book & { checkouts?: CheckoutSummary[] } }>(
            `/api/books/${id}`,
        );
    }
    async createBook(
        book: Omit<
            Book,
            | "id"
            | "created_at"
            | "updated_at"
            | "borrowedBy"
            | "dueDate"
            | "status"
        >,
    ) {
        return this.request<{ book: Book }>("/api/books", {
            method: "POST",
            body: JSON.stringify(book),
        });
    }
    async updateBook(id: number, book: Partial<Omit<Book, "id">>) {
        return this.request<{ book: Book }>(`/api/books/${id}`, {
            method: "PUT",
            body: JSON.stringify(book),
        });
    }
    async deleteBook(id: number) {
        return this.request<{ message: string }>(`/api/books/${id}`, {
            method: "DELETE",
        });
    }
    async updateBookStatus(
        id: number,
        status: "available" | "borrowed" | "maintenance",
    ) {
        return this.request<{ book: Book }>(`/api/books/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    }

    // 貸出一覧・追加・返却・延滞・ユーザー別履歴
    async getCheckouts(params?: {
        status?: string;
        user_id?: number;
        book_id?: number;
        page?: number;
        limit?: number;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.user_id)
            searchParams.append("user_id", params.user_id.toString());
        if (params?.book_id)
            searchParams.append("book_id", params.book_id.toString());
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());
        const query = searchParams.toString();
        return this.request<{
            checkouts: CheckoutWithUserAndBook[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/checkouts${query ? `?${query}` : ""}`);
    }
    async createCheckout(data: {
        book_id: number;
        user_id: number;
        due_date?: string;
    }) {
        return this.request<{ checkout: CheckoutWithBook }>("/api/checkouts", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }
    async returnBook(checkoutId: number, returnDate?: string) {
        return this.request<{ checkout: CheckoutWithUserAndBook }>(
            `/api/checkouts/${checkoutId}/return`,
            {
                method: "PUT",
                body: JSON.stringify({ return_date: returnDate }),
            },
        );
    }
    async getOverdueCheckouts(params?: { page?: number; limit?: number }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());
        const query = searchParams.toString();
        return this.request<{
            checkouts: CheckoutWithUserAndBook[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/checkouts/overdue${query ? `?${query}` : ""}`);
    }
    async getUserCheckouts(
        userId: number,
        params?: { status?: string; page?: number; limit?: number },
    ) {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());
        const query = searchParams.toString();
        return this.request<{
            checkouts: CheckoutWithBook[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/checkouts/user/${userId}${query ? `?${query}` : ""}`);
    }

    // 統計・ヘルスチェック
    async getStatsOverview() {
        return this.request<{
            total_books: number;
            available_books: number;
            borrowed_books: number;
            monthly_checkouts: number;
            overdue_books: number;
            total_users: number;
        }>("/api/stats/overview");
    }
    async getMonthlyStats(year?: number, month?: number) {
        const searchParams = new URLSearchParams();
        if (year) searchParams.append("year", year.toString());
        if (month) searchParams.append("month", month.toString());
        const query = searchParams.toString();
        return this.request<{
            year: number;
            month: number;
            stats: Array<{ month: string; checkouts: number; returns: number }>;
        }>(`/api/stats/monthly${query ? `?${query}` : ""}`);
    }
    async getPopularBooks(limit?: number) {
        const searchParams = new URLSearchParams();
        if (limit) searchParams.append("limit", limit.toString());
        const query = searchParams.toString();
        return this.request<{
            books: Array<{
                id: number;
                title: string;
                author: string;
                checkout_count: number;
            }>;
        }>(`/api/stats/popular${query ? `?${query}` : ""}`);
    }
    async getUserStats(userId: number) {
        return this.request<{
            total_checkouts: number;
            active_checkouts: number;
            overdue_checkouts: number;
            returned_books: number;
        }>(`/api/stats/user/${userId}`);
    }
    async healthCheck() {
        return this.request<{
            status: string;
            timestamp: string;
            service: string;
            version: string;
            uptime: number;
            environment: unknown;
        }>("/api/health");
    }

    // ユーザー管理（管理者のみ）
    async getUsers() {
        return this.request<{ users: User[] }>("/api/users");
    }
    async getUser(id: number) {
        return this.request<{ user: User }>(`/api/users/${id}`);
    }
    async updateUser(id: number, data: Partial<User>) {
        return this.request<{ user: User }>(`/api/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }
    async deleteUser(id: number) {
        return this.request<{ message: string }>(`/api/users/${id}`, {
            method: "DELETE",
        });
    }
    async updateUserRole(id: number, role: "user" | "admin") {
        return this.request<{ user: User }>(`/api/users/${id}/role`, {
            method: "PUT",
            body: JSON.stringify({ role }),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
