-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES ('Administrator', 'admin@library.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample books
INSERT INTO books (title, author, isbn, publisher, published_year, description, status) VALUES
('Go言語プログラミング', '山田太郎', '978-4-123456-78-9', '技術出版社', 2023, 'Go言語の基礎から応用まで学べる入門書', 'available'),
('データベース設計入門', '佐藤花子', '978-4-987654-32-1', 'データベース出版', 2022, '効率的なデータベース設計の手法を解説', 'available'),
('Web開発実践ガイド', '田中一郎', '978-4-555666-77-8', 'Web技術社', 2024, 'モダンなWeb開発技術の実践的な解説書', 'available'),
('JavaScript完全ガイド', '鈴木美咲', '978-4-111222-33-4', 'フロントエンド出版', 2023, 'JavaScriptの基礎から最新機能まで網羅', 'available'),
('React実践開発', '高橋健太', '978-4-444555-66-7', 'React出版', 2024, 'Reactを使った実践的なWebアプリケーション開発', 'available')
ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO users (name, email, password, student_id, role) 
VALUES ('山田太郎', 'yamada@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'S001', 'user')
ON CONFLICT (email) DO NOTHING;
