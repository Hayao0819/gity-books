import "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"];
        token?: JWT;
    }
}
