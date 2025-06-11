# 図書管理システム

図書の貸出・返却を管理するWebアプリケーション

## 技術スタック

### フロントエンド
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Client

### バックエンド (api/)
- Go 1.21
- Gin Framework
- Supabase (PostgreSQL, 認証, ストレージ)
- supabase-go

## プロジェクト構造

\`\`\`
library-management/
├── app/                   # Next.js App Router
├── components/            # Reactコンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ（Supabaseクライアントなど）
├── api/                  # Goバックエンド
│   ├── handlers/         # APIハンドラー
│   ├── models/          # データモデル
│   ├── middleware/      # ミドルウェア
│   ├── database/        # データベース設定
│   ├── utils/           # ユーティリティ（Supabase連携など）
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
\`\`\`

3. フロントエンドの環境変数を設定
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

4. `.env.local`ファイルを編集し、Supabase接続情報を設定:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

### Supabaseデータベーススキーマの作成

Supabaseダッシュボードで以下のSQLを実行してテーブルを作成:

\`\`\`sql
-- books テーブル
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  publisher TEXT,
  published_year INTEGER,
  description TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- checkouts テーブル
CREATE TABLE checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id),
  user_id UUID REFERENCES auth.users(id),
  borrowed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'borrowed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_checkouts_status ON checkouts(status);
CREATE INDEX idx_checkouts_user_id ON checkouts(user_id);
CREATE INDEX idx_checkouts_book_id ON checkouts(book_id);
\`\`\`

### Row Level Security (RLS) の設定

\`\`\`sql
-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーのみアクセス可能
CREATE POLICY "Books are viewable by authenticated users" ON books
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Books are insertable by authenticated users" ON books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Books are updatable by authenticated users" ON books
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Checkouts are viewable by authenticated users" ON checkouts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Checkouts are insertable by authenticated users" ON checkouts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Checkouts are updatable by authenticated users" ON checkouts
  FOR UPDATE USING (auth.role() = 'authenticated');
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

### 統計情報
- `GET /api/stats/overview` - 概要統計
- `GET /api/stats/monthly` - 月次統計
- `GET /api/stats/popular` - 人気本ランキング

## アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8080
- Supabaseダッシュボード: https://supabase.com/dashboard

## トラブルシューティング

### 1. ページが真っ白になる場合
- ブラウザの開発者ツール（F12）でコンソールエラーを確認
- 環境変数が正しく設定されているか確認
- Supabaseプロジェクトが正常に動作しているか確認

### 2. API接続エラー
- バックエンドサーバーが起動しているか確認
- Supabase接続情報が正しいか確認
- ネットワーク接続を確認

### 3. 認証エラー
- Supabase認証設定を確認
- JWT Secretが正しく設定されているか確認
- RLSポリシーが適切に設定されているか確認

## ライセンス

MIT License
\`\`\`

環境変数のサンプルファイルを作成します：
