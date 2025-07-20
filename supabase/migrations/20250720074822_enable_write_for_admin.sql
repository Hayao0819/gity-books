-- INSERT
CREATE POLICY "Allow admin insert on users"
  ON users
  FOR INSERT
  WITH CHECK (role = 'admin');

-- UPDATE
CREATE POLICY "Allow admin update on users"
  ON users
  FOR UPDATE
  USING (role = 'admin');

-- DELETE
CREATE POLICY "Allow admin delete on users"
  ON users
  FOR DELETE
  USING (role = 'admin');
