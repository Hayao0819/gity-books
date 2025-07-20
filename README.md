# 図書管理システム

図書の貸出・返却を管理するWebアプリケーション

## 技術スタック

### フロントエンド

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui

### バックエンド

- Go 1.21
- Gin Framework
- GORM (PostgreSQL ORM)
- JWT認証
- PostgreSQL

## APIエンドポイント一覧

### 認証関連

- `POST /api/auth/login` … Keycloak認証（リダイレクト）
- `POST /api/auth/logout` … ログアウト
- `GET /api/auth/me` … ログイン中ユーザーのアプリ情報取得
- `POST /api/auth/change-password` … パスワード変更
- `POST /api/auth/register` … 新規登録（Keycloak利用時は未使用）

### ユーザー管理

- `GET /api/users` … ユーザー一覧（管理者のみ、検索・ページング可）
- `GET /api/users/[id]` … ユーザー詳細（管理者のみ、貸出履歴含む）
- `PUT /api/users/[id]/role` … ユーザー権限変更（管理者のみ）

### 本（図書）管理

- `GET /api/books` … 本の一覧（検索・ページング可）
- `POST /api/books` … 本の追加
- `GET /api/books/[id]` … 本の詳細（貸出状況含む）
- `PUT /api/books/[id]` … 本の情報更新
- `DELETE /api/books/[id]` … 本の削除（論理削除）
- `PUT /api/books/[id]/status` … 本の状態変更（貸出可/貸出中/保守等）

### 貸出・返却

- `GET /api/checkouts` … 貸出一覧（検索・ページング可）
- `POST /api/checkouts` … 本の貸出
- `PUT /api/checkouts/[id]/return` … 本の返却
- `GET /api/checkouts/overdue` … 期限超過の貸出一覧
- `GET /api/checkouts/user/[user_id]` … 指定ユーザーの貸出履歴

### 統計・ヘルスチェック

- `GET /api/stats/overview` … 全体統計
- `GET /api/stats/monthly` … 月別統計
- `GET /api/stats/popular` … 人気図書ランキング
- `GET /api/stats/user/[user_id]` … ユーザー別統計
- `GET /api/health` … サーバーヘルスチェック

\`\`\`
library-management/
├── app/                   # Next.js App Router
├── components/            # Reactコンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ（APIクライアントなど）
├── api/                  # Goバックエンド
│   ├── handlers/         # APIハンドラー
│   ├── services/         # ビジネスロジック
│   ├── repositories/     # データアクセス層
│   ├── models/          # データモデル
│   ├── middleware/      # ミドルウェア
│   ├── database/        # データベース設定
│   ├── container/       # 依存性注入
│   ├── utils/           # ユーティリティ
│   ├── main.go
│   └── ...
├── docker-compose.yml   # Docker設定
├── Makefile            # 開発用コマンド
├── package.json        # Node.js依存関係
└── README.md
\`\`\`

## セットアップ

### 前提条件

- Docker & Docker Compose
- Go 1.21+ (ローカル開発用)
- Node.js 18+ (ローカル開発用)
- PostgreSQL 15+ (ローカル開発用)

### 環境変数の設定

1. APIの環境変数を設定
\`\`\`bash
cp api/.env.example api/.env
\`\`\`

2. `.env`ファイルを編集し、データベース接続情報を設定:
\`\`\`
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=library_management
DB_SSLMODE=disable
DB_TIMEZONE=UTC

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

ADMIN_EMAIL=<admin@library.com>
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
\`\`\`

3. フロントエンドの環境変数を設定
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

4. `.env.local`ファイルを編集:
\`\`\`
NEXT_PUBLIC_API_URL=<http://localhost:8080>
\`\`\`

### Dockerを使用した起動

\`\`\`bash
make up
\`\`\`

### ローカル開発

1. PostgreSQLデータベースを起動
\`\`\`bash

# Dockerを使用する場合

docker run --name postgres-library -e POSTGRES_PASSWORD=password -e POSTGRES_DB=library_management -p 5432:5432 -d postgres:15

# または既存のPostgreSQLインスタンスを使用

\`\`\`

2. 依存関係をインストール
\`\`\`bash
make install
\`\`\`

3. バックエンドを起動
\`\`\`bash
make dev-api
\`\`\`

4. フロントエンドを起動（別ターミナル）
\`\`\`bash
make dev-web
\`\`\`

## 開発用コマンド

\`\`\`bash

# 開発サーバー起動

make dev              # フロントエンドとバックエンドを同時起動
make dev-api          # バックエンドのみ起動
make dev-web          # フロントエンドのみ起動

# Docker関連

make build            # Dockerイメージをビルド
make up               # Docker Composeで起動
make down             # Docker Composeを停止
make logs             # ログを表示

# 依存関係のインストール

make install          # 全ての依存関係をインストール
make install-api      # Go依存関係をインストール
make install-web      # Node.js依存関係をインストール

# クリーンアップ

make clean            # Dockerリソースをクリーンアップ
\`\`\`

## API エンドポイント

### 認証

- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録
- `GET /api/auth/me` - ユーザー情報取得
- `POST /api/auth/logout` - ログアウト
- `PUT /api/auth/change-password` - パスワード変更

### 本の管理

- `GET /api/books` - 本一覧取得
- `POST /api/books` - 本の追加
- `GET /api/books/:id` - 本の詳細取得
- `PUT /api/books/:id` - 本の更新
- `DELETE /api/books/:id` - 本の削除
- `PUT /api/books/:id/status` - 本のステータス更新

### 貸出・返却

- `GET /api/checkouts` - 貸出一覧取得
- `POST /api/checkouts` - 貸出処理
- `PUT /api/checkouts/:id/return` - 返却処理
- `GET /api/checkouts/overdue` - 延滞本一覧
- `GET /api/checkouts/user/:user_id` - ユーザー別貸出履歴

### 統計情報

- `GET /api/stats/overview` - 概要統計
- `GET /api/stats/monthly` - 月次統計
- `GET /api/stats/popular` - 人気本ランキング
- `GET /api/stats/user/:user_id` - ユーザー別統計

### ユーザー管理（管理者のみ）

- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `GET /api/users/:id` - ユーザー詳細取得
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除
- `PUT /api/users/:id/role` - ユーザーロール更新

## 認証

このアプリケーションはJWTベースの認証を使用しています。

### デフォルト管理者アカウント

- **メールアドレス**: <admin@library.com>
- **パスワード**: admin123

初回起動時に自動的に作成されます。本番環境では必ずパスワードを変更してください。

## アクセス

- フロントエンド: <http://localhost:3000>
- バックエンドAPI: <http://localhost:8080>
- PostgreSQL: localhost:5432

## アーキテクチャ

このアプリケーションはクリーンアーキテクチャを採用しています：

### バックエンド層構造

1. **Handler層**: HTTP リクエスト/レスポンス処理
2. **Service層**: ビジネスロジック
3. **Repository層**: データアクセス
4. **Model層**: データ構造定義

### 主な特徴

- 依存性注入による疎結合設計
- インターフェースベースの実装
- トランザクション管理
- エラーハンドリング
- ログ機能

## トラブルシューティング

### 1. データベース接続エラー

- PostgreSQLが起動しているか確認
- 接続情報が正しいか確認
- ファイアウォール設定を確認

### 2. API接続エラー

- バックエンドサーバーが起動しているか確認
- CORS設定を確認
- ネットワーク接続を確認

### 3. 認証エラー

- JWT設定を確認
- トークンの有効期限を確認
- 管理者アカウントでログインできるか確認

## ライセンス

MIT License
