-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    student_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(255),
    published_year INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'checked_out', 'reserved', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Checkouts table
CREATE TABLE IF NOT EXISTS checkouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_user_id ON checkouts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_book_id ON checkouts(book_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON checkouts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_due_date ON checkouts(due_date) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));

-- RLS Policies for books table
CREATE POLICY "Anyone can view books" ON books
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Admins can manage books" ON books
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));

-- RLS Policies for checkouts table
CREATE POLICY "Users can view their own checkouts" ON checkouts
    FOR SELECT USING (user_id = auth.uid()::int OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));

CREATE POLICY "Users can create their own checkouts" ON checkouts
    FOR INSERT WITH CHECK (user_id = auth.uid()::int OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));

CREATE POLICY "Admins can manage all checkouts" ON checkouts
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::int AND role = 'admin'
    ));
