-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
VALUES (
    'Administrator',
    'admin@library.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- bcrypt hash for 'admin123'
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample user (password: user123)
INSERT INTO users (name, email, password_hash, student_id, role, created_at, updated_at) 
VALUES (
    'John Doe',
    'john@example.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'user123'
    'STU001',
    'user',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert sample books
INSERT INTO books (title, author, isbn, publisher, published_year, description, status, created_at, updated_at) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', 1925, 'A classic American novel set in the Jazz Age.', 'available', NOW(), NOW()),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'J.B. Lippincott & Co.', 1960, 'A gripping tale of racial injustice and childhood innocence.', 'available', NOW(), NOW()),
('1984', 'George Orwell', '9780451524935', 'Secker & Warburg', 1949, 'A dystopian social science fiction novel.', 'available', NOW(), NOW()),
('Pride and Prejudice', 'Jane Austen', '9780141439518', 'T. Egerton', 1813, 'A romantic novel of manners.', 'available', NOW(), NOW()),
('The Catcher in the Rye', 'J.D. Salinger', '9780316769174', 'Little, Brown and Company', 1951, 'A controversial novel about teenage rebellion.', 'checked_out', NOW(), NOW()),
('Lord of the Flies', 'William Golding', '9780571056866', 'Faber & Faber', 1954, 'A novel about British boys stranded on an island.', 'available', NOW(), NOW()),
('Animal Farm', 'George Orwell', '9780451526342', 'Secker & Warburg', 1945, 'An allegorical novella about farm animals.', 'available', NOW(), NOW()),
('Brave New World', 'Aldous Huxley', '9780060850524', 'Chatto & Windus', 1932, 'A dystopian novel set in a futuristic society.', 'available', NOW(), NOW()),
('The Hobbit', 'J.R.R. Tolkien', '9780547928227', 'George Allen & Unwin', 1937, 'A fantasy novel about a hobbit''s adventure.', 'available', NOW(), NOW()),
('Fahrenheit 451', 'Ray Bradbury', '9781451673319', 'Ballantine Books', 1953, 'A dystopian novel about book burning.', 'available', NOW(), NOW())
ON CONFLICT (isbn) DO NOTHING;

-- Insert sample checkout (The Catcher in the Rye checked out by John Doe)
INSERT INTO checkouts (user_id, book_id, checkout_date, due_date, status, created_at, updated_at)
SELECT 
    u.id,
    b.id,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '9 days',
    'active',
    NOW(),
    NOW()
FROM users u, books b
WHERE u.email = 'john@example.com' 
AND b.isbn = '9780316769174'
AND NOT EXISTS (
    SELECT 1 FROM checkouts c 
    WHERE c.user_id = u.id AND c.book_id = b.id AND c.status = 'active'
);
