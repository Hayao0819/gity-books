# 図書管理システム

図書の貸出・返却を管理するWebアプリケーション

## 技術スタック

### フロントエンド (web/)
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Client

### バックエンド (api/)
- Go 1.21
- Gin Framework
- Supabase (PostgreSQL, 認証, ストレージ)
- GORM

## プロジェクト構造

\`\`\`
library-management/
├── web/                    # Next.jsフロントエンド
│   ├── app/               # App Router
│   ├── components/        # Reactコンポーネント
│   ├── lib/              # ユーティリティ（Supabaseクライアントなど）
│   ├── package.json
│   └── ...
├── api/                   # Goバックエンド
│   ├── handlers/          # APIハンドラー
│   ├── models/           # データモデル
│   ├── middleware/       # ミドルウェア
│   ├── database/         # データベース設定
│   ├── utils/            # ユーティリティ（Supabase連携など）
│   ├── main.go
│   └── ...
├── docker-compose.yml    # Docker設定
├── Makefile             # 開発用コマンド
└── README.md
\`\`\`

## セットアップ

### 前提条件
- Docker & Docker Compose
- Go 1.21+ (ローカル開発用)
- Node.js 18+ (ローカル開発用)
- Supabaseアカウントとプロジェクト

### Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com/)にアクセスし、アカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得:
   - Project URL
   - API Keys (anon key)
   - Database Connection String
   - JWT Secret

### 環境変数の設定

1. APIの環境変数を設定
\`\`\`bash
cp api/.env.example api/.env
\`\`\`

2. `.env`ファイルを編集し、Supabase接続情報を設定:
\`\`\`
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_DB_HOST=db.your-project-id.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres
\`\`\`

3. フロントエンドの環境変数を設定
\`\`\`bash
cp web/.env.local.example web/.env.local
\`\`\`

4. `.env.local`ファイルを編集し、Supabase接続情報を設定:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

### Dockerを使用した起動

\`\`\`bash
make up
\`\`\`

### ローカル開発

1. 依存関係をインストール
\`\`\`bash
make install
\`\`\`

2. バックエンドを起動
\`\`\`bash
make dev-api
\`\`\`

3. フロントエンドを起動（別ターミナル）
\`\`\`bash
make dev-web
\`\`\`

## Supabaseの機能

このプロジェクトでは以下のSupabase機能を利用しています:

1. **認証** - ユーザー登録、ログイン、JWTトークン管理
2. **データベース** - PostgreSQLデータベースでのデータ管理
3. **Row Level Security** - データアクセス制御
4. **ストレージ** - 必要に応じてファイル保存（本の表紙画像など）

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン (Supabase認証)
- `GET /api/auth/me` - ユーザー情報取得
- `POST /api/auth/logout` - ログアウト

### 本の管理
- `GET /api/books` - 本一覧取得
- `POST /api/books` - 本の追加
- `GET /api/books/:id` - 本の詳細取得
- `PUT /api/books/:id` - 本の更新
- `DELETE /api/books/:id` - 本の削除

### 貸出・返却
- `GET /api/checkouts` - 貸出一覧取得
- `POST /api/checkouts` - 貸出処理
- `PUT /api/checkouts/:id/return` - 返却処理
- `GET /api/checkouts/overdue` - 延滞本一覧

### ユーザー管理（管理者のみ）
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー追加
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除

### 統計情報
- `GET /api/stats/overview` - 概要統計
- `GET /api/stats/monthly` - 月次統計
- `GET /api/stats/popular` - 人気本ランキング

## ライセンス

MIT License
