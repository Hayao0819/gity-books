# gity-books（図書管理システム）

図書の貸出・返却・管理を行うWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes（Edge Functions）、Supabase/PostgreSQL
- **認証**: JWT（NextAuth.js/Keycloak）
- **インフラ**: Docker, Docker Compose, Vercel

## ディレクトリ構成

```
app/         ... Next.js App Router/各種ページ・API
components/  ... UIコンポーネント
hooks/       ... Reactカスタムフック
lib/         ... APIクライアント・認証・DB型定義
public/      ... 画像等静的ファイル
styles/      ... グローバルCSS
supabase/    ... DBマイグレーション・設定
types/       ... 型定義
```

## 主な機能

- 図書の検索・登録・編集・削除
- 図書の貸出・返却・延滞管理
- ユーザー管理（管理者のみ）
- 統計情報（全体・月次・人気本・ユーザー別）
- JWT認証・権限管理

## APIエンドポイント例

### 認証

- `GET /api/auth/me` … ログイン中ユーザー情報取得（JWT必須）
- `GET|POST /api/auth/[...nextauth]` … NextAuth.js認証エンドポイント

### 本（図書）管理

- `GET /api/books` … 本の一覧（検索・ページング可、認証任意）
  - クエリ: `search`, `status`, `page`, `limit`
- `POST /api/books` … 本の追加（認証必須）
- `GET /api/books/[id]` … 本の詳細・貸出状況（認証必須）
- `PUT /api/books/[id]` … 本の情報更新（認証必須）
- `DELETE /api/books/[id]` … 本の削除（論理削除、認証必須、貸出中は不可）
- `PUT /api/books/[id]/status` … 本の状態変更（available/borrowed/maintenance、認証必須）

### 貸出・返却

- `GET /api/checkouts` … 貸出一覧（検索・ページング可、認証必須）
- `POST /api/checkouts` … 本の貸出（認証必須）
- `PUT /api/checkouts/[id]/return` … 本の返却（認証必須）
- `GET /api/checkouts/overdue` … 延滞一覧（認証必須）
- `GET /api/checkouts/user/[user_id]` … 指定ユーザーの貸出履歴（認証必須）

### 統計・ヘルスチェック

- `GET /api/stats/overview` … 全体統計
- `GET /api/stats/monthly` … 月次統計
- `GET /api/stats/popular` … 人気本ランキング
- `GET /api/stats/user/[user_id]` … ユーザー別統計
- `GET /api/health` … サーバーヘルスチェック

### ユーザー管理

- `GET /api/users` … ユーザー一覧（管理者のみ）
- `GET /api/users/[id]` … ユーザー詳細（管理者のみ）
- `PUT /api/users/[id]` … ユーザー情報更新（管理者のみ）
- `DELETE /api/users/[id]` … ユーザー削除（管理者のみ）
- `PUT /api/users/[id]/role` … ユーザー権限変更（管理者のみ）

## セットアップ

### 前提

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+

### 初期設定

1. 環境変数ファイルを作成

 ```bash
 cp .env.local.example .env.local
 ```

 必要に応じてAPI URL等を編集

2. Supabaseの設定（必要に応じて）

 ```bash
 # DBマイグレーション等
 ```

3. 依存関係インストール

 ```bash
 pnpm install
 ```

4. Dockerで起動

 ```bash
 docker compose up
 ```

5. ローカル開発

 ```bash
 pnpm dev
 ```

## 認証

- JWTベースの認証（NextAuth.js/Supabase）
- デフォルト管理者アカウントは初回起動時に自動作成
- 本番運用時は必ずパスワードを変更してください

## アーキテクチャ

- Next.js App RouterによるSPA/SSR
- Supabase/PostgreSQLによるデータ管理
- クリーンアーキテクチャを意識したAPI設計
- 型安全なTypeScriptによる実装

## トラブルシューティング

- DB接続エラー: PostgreSQLの起動・接続情報を確認
- APIエラー: サーバー起動・CORS・ネットワークを確認
- 認証エラー: JWT設定・トークン有効期限・管理者アカウントを確認

## ライセンス

MIT License
