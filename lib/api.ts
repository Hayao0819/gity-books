const API_BASE_URL = "";

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        // Load token from localStorage if available
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("auth_token");
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const appendHeaders: [string, string][] = [
            ["Content-Type", "application/json"],
        ];

        if (this.token) {
            // headers.Authorization = `Bearer ${this.token}`;
            appendHeaders.push(["Authorization", `Bearer ${this.token}`]);
        }

        const response = await fetch(url, {
            ...options,
            ...appendHeaders,
            // ...options.headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || `HTTP error! status: ${response.status}`,
            );
        }

        return response.json();
    }

    // Auth methods
    async login(email: string, password: string) {
        const response = await this.request<{
            token: string;
            user: {
                id: number;
                email: string;
                name: string;
                role: string;
            };
        }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        this.setToken(response.token);
        return response;
    }

    async register(userData: {
        name: string;
        email: string;
        password: string;
        student_id?: string;
    }) {
        const response = await this.request<{
            token: string;
            user: {
                id: number;
                email: string;
                name: string;
                role: string;
            };
        }>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        this.setToken(response.token);
        return response;
    }

    async logout() {
        await this.request("/api/auth/logout", {
            method: "POST",
        });
        this.clearToken();
    }

    async getMe() {
        return this.request<{
            user: {
                id: number;
                email: string;
                name: string;
                role: string;
                student_id?: string;
                created_at: string;
            };
        }>("/api/auth/me");
    }

    // Books methods
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
            books: Array<{
                id: number;
                title: string;
                author: string;
                isbn: string;
                publisher?: string;
                published_year?: number;
                description?: string;
                status: string;
                created_at: string;
                updated_at: string;
            }>;
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/books${query ? `?${query}` : ""}`);
    }

    async getBook(id: number) {
        return this.request<{
            book: {
                id: number;
                title: string;
                author: string;
                isbn: string;
                publisher?: string;
                published_year?: number;
                description?: string;
                status: string;
                created_at: string;
                updated_at: string;
            };
        }>(`/api/books/${id}`);
    }

    async createBook(bookData: {
        title: string;
        author: string;
        isbn?: string;
        publisher?: string;
        published_year?: number;
        description?: string;
    }) {
        return this.request<{
            book: {
                id: number;
                title: string;
                author: string;
                isbn: string;
                publisher?: string;
                published_year?: number;
                description?: string;
                status: string;
                created_at: string;
                updated_at: string;
            };
        }>("/api/books", {
            method: "POST",
            body: JSON.stringify(bookData),
        });
    }

    // Checkouts methods
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
            checkouts: Array<{
                id: number;
                book_id: number;
                user_id: number;
                borrowed_date: string;
                due_date: string;
                return_date?: string;
                status: string;
                book?: {
                    id: number;
                    title: string;
                    author: string;
                    isbn: string;
                };
                user?: {
                    id: number;
                    name: string;
                    email: string;
                };
            }>;
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/checkouts${query ? `?${query}` : ""}`);
    }

    async createCheckout(checkoutData: {
        book_id: number;
        user_id: number;
        due_date?: string;
    }) {
        return this.request<{
            checkout: {
                id: number;
                book_id: number;
                user_id: number;
                borrowed_date: string;
                due_date: string;
                status: string;
            };
        }>("/api/checkouts", {
            method: "POST",
            body: JSON.stringify(checkoutData),
        });
    }

    async returnBook(checkoutId: number, returnDate?: string) {
        return this.request<{
            checkout: {
                id: number;
                book_id: number;
                user_id: number;
                borrowed_date: string;
                due_date: string;
                return_date: string;
                status: string;
            };
        }>(`/api/checkouts/${checkoutId}/return`, {
            method: "PUT",
            body: JSON.stringify({ return_date: returnDate }),
        });
    }

    // Stats methods
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

    // Users methods (admin only)
    async getUsers(params?: {
        search?: string;
        role?: string;
        page?: number;
        limit?: number;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.role) searchParams.append("role", params.role);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{
            users: Array<{
                id: number;
                name: string;
                email: string;
                role: string;
                student_id?: string;
                created_at: string;
                updated_at: string;
            }>;
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/users${query ? `?${query}` : ""}`);
    }

    async createUser(userData: {
        name: string;
        email: string;
        password: string;
        student_id?: string;
        role?: string;
    }) {
        return this.request<{
            user: {
                id: number;
                name: string;
                email: string;
                role: string;
                student_id?: string;
                created_at: string;
                updated_at: string;
            };
        }>("/api/users", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    }

    async updateUser(
        id: number,
        userData: {
            name: string;
            email: string;
            password?: string;
            student_id?: string;
            role?: string;
        },
    ) {
        return this.request<{
            user: {
                id: number;
                name: string;
                email: string;
                role: string;
                student_id?: string;
                created_at: string;
                updated_at: string;
            };
        }>(`/api/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id: number) {
        return this.request<{ message: string }>(`/api/users/${id}`, {
            method: "DELETE",
        });
    }

    async updateUserRole(id: number, role: string) {
        return this.request<{
            user: {
                id: number;
                name: string;
                email: string;
                role: string;
                student_id?: string;
                created_at: string;
                updated_at: string;
            };
        }>(`/api/users/${id}/role`, {
            method: "PUT",
            body: JSON.stringify({ role }),
        });
    }

    async getOverdueCheckouts(params?: { page?: number; limit?: number }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{
            checkouts: Array<{
                id: number;
                book_id: number;
                user_id: number;
                borrowed_date: string;
                due_date: string;
                return_date?: string;
                status: string;
                book?: {
                    id: number;
                    title: string;
                    author: string;
                    isbn: string;
                };
                user?: {
                    id: number;
                    name: string;
                    email: string;
                };
            }>;
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
        params?: {
            status?: string;
            page?: number;
            limit?: number;
        },
    ) {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const query = searchParams.toString();
        return this.request<{
            checkouts: Array<{
                id: number;
                book_id: number;
                user_id: number;
                borrowed_date: string;
                due_date: string;
                return_date?: string;
                status: string;
                book?: {
                    id: number;
                    title: string;
                    author: string;
                    isbn: string;
                };
            }>;
            pagination: {
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
        }>(`/api/checkouts/user/${userId}${query ? `?${query}` : ""}`);
    }

    async getMonthlyStats(year?: number, month?: number) {
        const searchParams = new URLSearchParams();
        if (year) searchParams.append("year", year.toString());
        if (month) searchParams.append("month", month.toString());

        const query = searchParams.toString();
        return this.request<{
            year: number;
            month: number;
            stats: Array<{
                month: string;
                checkouts: number;
                returns: number;
            }>;
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
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
