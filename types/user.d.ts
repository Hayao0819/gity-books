// Keycloakのユーザー情報型
export interface User {
    sub: string;
    email?: string;
    name?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    /**
     * アプリケーション固有のロール情報はSupabase等で管理し、
     * KeycloakのIDトークンには含まれない場合が多い
     */
    role?: "user" | "admin";
    // 必要に応じて追加
}
