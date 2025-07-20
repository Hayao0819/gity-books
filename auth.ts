import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { Session } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { JWT } from "next-auth/jwt";
import type { Account } from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [Keycloak],
    callbacks: {
        async signIn({ user }) {
            // Supabase usersテーブルに登録（存在しない場合のみ）
            if (!user?.email) {
                console.error("User email is required for registration");
                return false;
            }
            const { data } = await supabaseAdmin
                .from("users")
                .select("id")
                .eq("email", user.email)
                .maybeSingle();
            if (!data) {
                // 新規登録
                const { error: insertError } = await supabaseAdmin
                    .from("users")
                    .insert({
                        name: user.name ?? user.email,
                        email: user.email,
                        role: "user",
                    });
                if (insertError) {
                    console.error("Supabase user insert error:", insertError);
                }
            }
            return true;
        },

        async jwt({
            token,
            account,
        }: { token: JWT; account?: Account | null }) {
            // Persist the OAuth access_token and or the user id to the token right after signin
            if (account) {
                token.accessToken = account.access_token;
                token.id = account.providerAccountId;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            // Add accessToken to session (型拡張)
            (session as Session & { accessToken?: string }).accessToken =
                token.accessToken as string;
            if (session.user) {
                (session.user as typeof session.user & { id?: string }).id =
                    token.id as string;
            }
            return session;
        },
    },
});
