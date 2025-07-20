import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // Keycloak認証後のユーザー一覧取得は、DB連携部分のみ残す
    // 必要に応じてKeycloakのセッション情報でフィルタリング可能
    // ここではサンプルとして空配列を返す
    return NextResponse.json({ users: [] });
}

// POST method removed - users are created automatically when they first authenticate with Keycloak
