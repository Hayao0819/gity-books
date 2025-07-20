import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { supabaseAdmin } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [Keycloak],
    callbacks: {
        async signIn({ user }) {
            // Supabase usersテーブルに登録（存在しない場合のみ）
            if (!user?.email) return true;
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
                        password_hash: "keycloak", // ダミー値
                    });
                if (insertError) {
                    console.error("Supabase user insert error:", insertError);
                }
            }
            return true;
        },

        async jwt({ token, account }) {
            // Persist the OAuth access_token and or the user id to the token right after signin
            if (account) {
                token.accessToken = account.access_token;
                token.id = account.providerAccountId;
            }
            return token;
        },
    },
});
