-- Create database if it doesn't exist
SELECT 'CREATE DATABASE library_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'library_management')\gexec

-- Connect to the library_management database
\c library_management;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created automatically by GORM, but we can add custom ones here if needed

-- Example: Create a full-text search index for books
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_fulltext 
-- ON books USING gin(to_tsvector('japanese', title || ' ' || author || ' ' || COALESCE(description, '')));
