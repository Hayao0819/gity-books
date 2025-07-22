import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export function useAuth() {
    const { data: session, status } = useSession();

    const user = session?.user ?? null;
    const loading = status === "loading";
    const authenticated = status === "authenticated";

    return {
        user,
        loading,
        login: (redirectTo?: string) =>
            signIn("keycloak", redirectTo ? { redirectTo } : {}),
        logout: () => signOut(),
        authenticated,
        session,
    };
}

// 未ログインの場合にloginへ遷移するフック
export function useRequireLoginRedirect() {
    const { authenticated, loading } = useAuth();
    useEffect(() => {
        if (!loading && !authenticated) {
            window.location.replace("/login?required=true");
        }
    }, [authenticated, loading]);
}
