package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Name      string    `json:"name" gorm:"not null;size:255"`
    Email     string    `json:"email" gorm:"uniqueIndex;not null;size:255"`
    Password  string    `json:"-" gorm:"not null;size:255"`
    StudentID *string   `json:"student_id,omitempty" gorm:"size:50"`
    Role      string    `json:"role" gorm:"not null;default:user;size:50"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
    
    // リレーション
    Checkouts []Checkout `json:"checkouts,omitempty" gorm:"foreignKey:UserID"`
}

type Book struct {
    ID            uint      `json:"id" gorm:"primaryKey"`
    Title         string    `json:"title" gorm:"not null;size:500"`
    Author        string    `json:"author" gorm:"not null;size:255"`
    ISBN          string    `json:"isbn" gorm:"size:20;index"`
    Publisher     string    `json:"publisher" gorm:"size:255"`
    PublishedYear int       `json:"published_year"`
    Description   string    `json:"description" gorm:"type:text"`
    Status        string    `json:"status" gorm:"not null;default:available;size:50"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
    DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
    
    // リレーション
    Checkouts []Checkout `json:"checkouts,omitempty" gorm:"foreignKey:BookID"`
}

type Checkout struct {
    ID           uint       `json:"id" gorm:"primaryKey"`
    BookID       uint       `json:"book_id" gorm:"not null;index"`
    Book         *Book      `json:"book,omitempty" gorm:"foreignKey:BookID"`
    UserID       uint       `json:"user_id" gorm:"not null;index"`
    User         *User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
    BorrowedDate time.Time  `json:"borrowed_date" gorm:"not null"`
    DueDate      time.Time  `json:"due_date" gorm:"not null"`
    ReturnDate   *time.Time `json:"return_date,omitempty"`
    Status       string     `json:"status" gorm:"not null;default:borrowed;size:50"`
    CreatedAt    time.Time  `json:"created_at"`
    UpdatedAt    time.Time  `json:"updated_at"`
    DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// リクエスト構造体
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

type CreateBookRequest struct {
    Title         string `json:"title" binding:"required,max=500"`
    Author        string `json:"author" binding:"required,max=255"`
    ISBN          string `json:"isbn" binding:"max=20"`
    Publisher     string `json:"publisher" binding:"max=255"`
    PublishedYear int    `json:"published_year" binding:"min=1000,max=9999"`
    Description   string `json:"description"`
}

type UpdateBookRequest struct {
    Title         string `json:"title" binding:"required,max=500"`
    Author        string `json:"author" binding:"required,max=255"`
    ISBN          string `json:"isbn" binding:"max=20"`
    Publisher     string `json:"publisher" binding:"max=255"`
    PublishedYear int    `json:"published_year" binding:"min=1000,max=9999"`
    Description   string `json:"description"`
}

type CreateUserRequest struct {
    Name      string  `json:"name" binding:"required,max=255"`
    Email     string  `json:"email" binding:"required,email,max=255"`
    Password  string  `json:"password" binding:"required,min=6,max=255"`
    StudentID *string `json:"student_id" binding:"omitempty,max=50"`
    Role      string  `json:"role" binding:"omitempty,oneof=user admin"`
}

type CreateCheckoutRequest struct {
    BookID  uint       `json:"book_id" binding:"required"`
    UserID  uint       `json:"user_id" binding:"required"`
    DueDate *time.Time `json:"due_date"`
}

type ReturnBookRequest struct {
    ReturnDate *time.Time `json:"return_date"`
    Condition  string     `json:"condition" binding:"max=255"`
}

type StatsOverview struct {
    TotalBooks       int64 `json:"total_books"`
    AvailableBooks   int64 `json:"available_books"`
    BorrowedBooks    int64 `json:"borrowed_books"`
    MonthlyCheckouts int64 `json:"monthly_checkouts"`
    OverdueBooks     int64 `json:"overdue_books"`
    TotalUsers       int64 `json:"total_users"`
}

type PopularBook struct {
    ID            uint   `json:"id"`
    Title         string `json:"title"`
    Author        string `json:"author"`
    CheckoutCount int64  `json:"checkout_count"`
}

type MonthlyStats struct {
    Month     string `json:"month"`
    Checkouts int64  `json:"checkouts"`
    Returns   int64  `json:"returns"`
}

// 定数定義
const (
    BookStatusAvailable = "available"
    BookStatusBorrowed  = "borrowed"
    BookStatusMaintenance = "maintenance"
    
    CheckoutStatusBorrowed = "borrowed"
    CheckoutStatusReturned = "returned"
    CheckoutStatusOverdue  = "overdue"
    
    UserRoleUser  = "user"
    UserRoleAdmin = "admin"
)
