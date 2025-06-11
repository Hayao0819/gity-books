package repositories

import (
	"library-management/models"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *models.User) error
	GetByID(id uint) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByStudentID(studentID string) (*models.User, error)
	Update(user *models.User) error
	Delete(id uint) error
	List(filter UserFilter) ([]models.User, int64, error)
	UpdateRole(id uint, role string) error
	UpdatePassword(id uint, hashedPassword string) error
}

// BookRepository defines the interface for book data operations
type BookRepository interface {
	Create(book *models.Book) error
	GetByID(id uint) (*models.Book, error)
	GetByISBN(isbn string) (*models.Book, error)
	Update(book *models.Book) error
	Delete(id uint) error
	List(filter BookFilter) ([]models.Book, int64, error)
	UpdateStatus(id uint, status string) error
	GetAvailableCount() (int64, error)
	GetBorrowedCount() (int64, error)
	GetTotalCount() (int64, error)
}

// CheckoutRepository defines the interface for checkout data operations
type CheckoutRepository interface {
	Create(checkout *models.Checkout) error
	GetByID(id uint) (*models.Checkout, error)
	Update(checkout *models.Checkout) error
	Delete(id uint) error
	List(filter CheckoutFilter) ([]models.Checkout, int64, error)
	GetByUserID(userID uint, filter CheckoutFilter) ([]models.Checkout, int64, error)
	GetOverdue() ([]models.Checkout, int64, error)
	GetActiveByUserID(userID uint) (int64, error)
	GetActiveByBookID(bookID uint) (int64, error)
	GetMonthlyStats(year, month int) ([]models.MonthlyStats, error)
	GetPopularBooks(limit int) ([]models.PopularBook, error)
	GetUserStats(userID uint) (*UserStats, error)
	GetMonthlyCheckoutCount() (int64, error)
	GetOverdueCount() (int64, error)
}

// Filter structs for repository queries
type UserFilter struct {
	Search string
	Role   string
	Page   int
	Limit  int
}

type BookFilter struct {
	Search string
	Status string
	Page   int
	Limit  int
}

type CheckoutFilter struct {
	Status string
	UserID uint
	BookID uint
	Page   int
	Limit  int
}

type UserStats struct {
	TotalCheckouts   int64 `json:"total_checkouts"`
	ActiveCheckouts  int64 `json:"active_checkouts"`
	OverdueCheckouts int64 `json:"overdue_checkouts"`
	ReturnedBooks    int64 `json:"returned_books"`
}
