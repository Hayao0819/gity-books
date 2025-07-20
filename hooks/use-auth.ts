import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
    const { data: session, status } = useSession();

    const user = session?.user ?? null;
    const loading = status === "loading";
    const authenticated = status === "authenticated";


    return {
        user,
        loading,
        login: () => signIn("keycloak"),
        logout: () => signOut(),
        authenticated,
        session,
    };
}
