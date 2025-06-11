package models

import (
    "time"
)

type User struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Password  string    `json:"-"`
    StudentID *string   `json:"student_id,omitempty"`
    Role      string    `json:"role"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Book struct {
    ID            string     `json:"id"`
    Title         string     `json:"title"`
    Author        string     `json:"author"`
    ISBN          string     `json:"isbn"`
    Publisher     string     `json:"publisher"`
    PublishedYear int        `json:"published_year"`
    Description   string     `json:"description"`
    Status        string     `json:"status"`
    CreatedAt     time.Time  `json:"created_at"`
    UpdatedAt     time.Time  `json:"updated_at"`
}

type Checkout struct {
    ID           string     `json:"id"`
    BookID       string     `json:"book_id"`
    Book         *Book      `json:"book,omitempty"`
    UserID       string     `json:"user_id"`
    User         *User      `json:"user,omitempty"`
    BorrowedDate time.Time  `json:"borrowed_date"`
    DueDate      time.Time  `json:"due_date"`
    ReturnDate   *time.Time `json:"return_date,omitempty"`
    Status       string     `json:"status"`
    CreatedAt    time.Time  `json:"created_at"`
    UpdatedAt    time.Time  `json:"updated_at"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

type CreateBookRequest struct {
    Title         string `json:"title" binding:"required"`
    Author        string `json:"author" binding:"required"`
    ISBN          string `json:"isbn"`
    Publisher     string `json:"publisher"`
    PublishedYear int    `json:"published_year"`
    Description   string `json:"description"`
}

type CreateUserRequest struct {
    Name      string  `json:"name" binding:"required"`
    Email     string  `json:"email" binding:"required,email"`
    Password  string  `json:"password" binding:"required,min=6"`
    StudentID *string `json:"student_id"`
    Role      string  `json:"role"`
}

type CreateCheckoutRequest struct {
    BookID  string     `json:"book_id" binding:"required"`
    UserID  string     `json:"user_id" binding:"required"`
    DueDate *time.Time `json:"due_date"`
}

type ReturnBookRequest struct {
    ReturnDate *time.Time `json:"return_date"`
    Condition  string     `json:"condition"`
}

type StatsOverview struct {
    TotalBooks       int64 `json:"total_books"`
    BorrowedBooks    int64 `json:"borrowed_books"`
    MonthlyCheckouts int64 `json:"monthly_checkouts"`
    OverdueBooks     int64 `json:"overdue_books"`
}

type PopularBook struct {
    ID            string `json:"id"`
    Title         string `json:"title"`
    CheckoutCount int64  `json:"checkout_count"`
}
