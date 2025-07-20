-- Row Level Security (RLS) 有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- books: 読み取りは全員、書き込みはadminのみ
CREATE POLICY "Allow read to all" ON books
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to insert" ON books
  FOR INSERT
  WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Allow admin to update" ON books
  FOR UPDATE
  USING (auth.role() = 'admin');

CREATE POLICY "Allow admin to delete" ON books
  FOR DELETE
  USING (auth.role() = 'admin');

-- users: 自分のみ書き込み可能
CREATE POLICY "Allow read to all" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow user to update self" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Allow user to delete self" ON users
  FOR DELETE
  USING (auth.uid()::text = id::text);

-- checkouts: 追加は誰でも可能、他は自分のみ
CREATE POLICY "Allow insert to all" ON checkouts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow user to read own checkouts" ON checkouts
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow user to update own checkouts" ON checkouts
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow user to delete own checkouts" ON checkouts
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
