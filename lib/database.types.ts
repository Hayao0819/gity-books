export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            books: {
                Row: {
                    id: number;
                    title: string;
                    author: string;
                    isbn: string | null;
                    publisher: string | null;
                    published_year: number | null;
                    description: string | null;
                    status:
                        | "available"
                        | "checked_out"
                        | "reserved"
                        | "maintenance";
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: number;
                    title: string;
                    author: string;
                    isbn?: string | null;
                    publisher?: string | null;
                    published_year?: number | null;
                    description?: string | null;
                    status?:
                        | "available"
                        | "checked_out"
                        | "reserved"
                        | "maintenance";
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: number;
                    title?: string;
                    author?: string;
                    isbn?: string | null;
                    publisher?: string | null;
                    published_year?: number | null;
                    description?: string | null;
                    status?:
                        | "available"
                        | "checked_out"
                        | "reserved"
                        | "maintenance";
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [];
            };
            checkouts: {
                Row: {
                    id: number;
                    user_id: number;
                    book_id: number;
                    checkout_date: string;
                    due_date: string;
                    return_date: string | null;
                    status: "active" | "returned" | "overdue";
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: number;
                    user_id: number;
                    book_id: number;
                    checkout_date?: string;
                    due_date: string;
                    return_date?: string | null;
                    status?: "active" | "returned" | "overdue";
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: number;
                    user_id?: number;
                    book_id?: number;
                    checkout_date?: string;
                    due_date?: string;
                    return_date?: string | null;
                    status?: "active" | "returned" | "overdue";
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "checkouts_book_id_fkey";
                        columns: ["book_id"];
                        isOneToOne: false;
                        referencedRelation: "books";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "checkouts_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                ];
            };
            users: {
                Row: {
                    id: number;
                    name: string;
                    email: string;
                    password_hash: string;
                    role: "user" | "admin";
                    student_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: number;
                    name: string;
                    email: string;
                    password_hash: string;
                    role?: "user" | "admin";
                    student_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: number;
                    name?: string;
                    email?: string;
                    password_hash?: string;
                    role?: "user" | "admin";
                    student_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
    PublicTableNameOrOptions extends
        | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
              Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
          Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
            PublicSchema["Views"])
      ? (PublicSchema["Tables"] &
            PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    PublicTableNameOrOptions extends
        | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    PublicTableNameOrOptions extends
        | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    PublicEnumNameOrOptions extends
        | keyof PublicSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
      ? PublicSchema["Enums"][PublicEnumNameOrOptions]
      : never;
