package services

import (
    "errors"
    "time"
    "gorm.io/gorm"
    "library-management/models"
    "library-management/repositories"
)

type CheckoutService struct {
    checkoutRepo repositories.CheckoutRepository
    bookRepo     repositories.BookRepository
    userRepo     repositories.UserRepository
    db           *gorm.DB
}

func NewCheckoutService(
    checkoutRepo repositories.CheckoutRepository,
    bookRepo repositories.BookRepository,
    userRepo repositories.UserRepository,
    db *gorm.DB,
) *CheckoutService {
    return &CheckoutService{
        checkoutRepo: checkoutRepo,
        bookRepo:     bookRepo,
        userRepo:     userRepo,
        db:           db,
    }
}

func (s *CheckoutService) CreateCheckout(req *models.CreateCheckoutRequest) (*models.Checkout, error) {
    // Start transaction
    tx := s.db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()
    
    // Check book availability
    book, err := s.bookRepo.GetByID(req.BookID)
    if err != nil {
        tx.Rollback()
        return nil, err
    }
    
    if book.Status != models.BookStatusAvailable {
        tx.Rollback()
        return nil, errors.New("book is not available for checkout")
    }
    
    // Check user exists
    _, err = s.userRepo.GetByID(req.UserID)
    if err != nil {
        tx.Rollback()
        return nil, err
    }
    
    // Check user's checkout limit (max 5 books)
    activeCheckouts, err := s.checkoutRepo.GetActiveByUserID(req.UserID)
    if err != nil {
        tx.Rollback()
        return nil, err
    }
    
    if activeCheckouts >= 5 {
        tx.Rollback()
        return nil, errors.New("user has reached maximum checkout limit (5 books)")
    }
    
    // Set due date (default 2 weeks)
    dueDate := time.Now().AddDate(0, 0, 14)
    if req.DueDate != nil {
        dueDate = *req.DueDate
    }
    
    // Create checkout
    checkout := &models.Checkout{
        BookID:       req.BookID,
        UserID:       req.UserID,
        BorrowedDate: time.Now(),
        DueDate:      dueDate,
        Status:       models.CheckoutStatusBorrowed,
    }
    
    if err := s.checkoutRepo.Create(checkout); err != nil {
        tx.Rollback()
        return nil, err
    }
    
    // Update book status
    if err := s.bookRepo.UpdateStatus(req.BookID, models.BookStatusBorrowed); err != nil {
        tx.Rollback()
        return nil, err
    }
    
    // Commit transaction
    if err := tx.Commit().Error; err != nil {
        return nil, err
    }
    
    // Return checkout with preloaded data
    return s.checkoutRepo.GetByID(checkout.ID)
}

func (s *CheckoutService) ReturnBook(id uint, returnDate *time.Time) (*models.Checkout, error) {
    if returnDate == nil {
        now := time.Now()
        returnDate = &now
    }
    
    // Start transaction
    tx := s.db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()
    
    // Get checkout
    checkout, err := s.checkoutRepo.GetByID(id)
    if err != nil {
        tx.Rollback()
        return nil, err
    }
    
    if checkout.Status != models.CheckoutStatusBorrowed {
        tx.Rollback()
        return nil, errors.New("checkout is not active")
    }
    
    // Update checkout
    checkout.ReturnDate = returnDate
    checkout.Status = models.CheckoutStatusReturned
    
    if err := s.checkoutRepo.Update(checkout); err != nil {
        tx.Rollback()
        return nil, err
    }
    
    // Update book status
    if err := s.bookRepo.UpdateStatus(checkout.BookID, models.BookStatusAvailable); err != nil {
        tx.Rollback()
        return nil, err
    }
    
    // Commit transaction
    if err := tx.Commit().Error; err != nil {
        return nil, err
    }
    
    return s.checkoutRepo.GetByID(id)
}

func (s *CheckoutService) ListCheckouts(filter repositories.CheckoutFilter) ([]models.Checkout, int64, error) {
    return s.checkoutRepo.List(filter)
}

func (s *CheckoutService) GetUserCheckouts(userID uint, filter repositories.CheckoutFilter) ([]models.Checkout, int64, error) {
    return s.checkoutRepo.GetByUserID(userID, filter)
}

func (s *CheckoutService) GetOverdueCheckouts() ([]models.Checkout, int64, error) {
    return s.checkoutRepo.GetOverdue()
}

func (s *CheckoutService) GetStatsOverview() (*models.StatsOverview, error) {
    stats := &models.StatsOverview{}
    
    var err error
    
    // Get book statistics
    stats.TotalBooks, err = s.bookRepo.GetTotalCount()
    if err != nil {
        return nil, err
    }
    
    stats.AvailableBooks, err = s.bookRepo.GetAvailableCount()
    if err != nil {
        return nil, err
    }
    
    stats.BorrowedBooks, err = s.bookRepo.GetBorrowedCount()
    if err != nil {
        return nil, err
    }
    
    // Get checkout statistics
    stats.MonthlyCheckouts, err = s.checkoutRepo.GetMonthlyCheckoutCount()
    if err != nil {
        return nil, err
    }
    
    stats.OverdueBooks, err = s.checkoutRepo.GetOverdueCount()
    if err != nil {
        return nil, err
    }
    
    // Get user count
    userFilter := repositories.UserFilter{Page: 1, Limit: 1}
    _, stats.TotalUsers, err = s.userRepo.List(userFilter)
    if err != nil {
        return nil, err
    }
    
    return stats, nil
}

func (s *CheckoutService) GetMonthlyStats(year, month int) ([]models.MonthlyStats, error) {
    return s.checkoutRepo.GetMonthlyStats(year, month)
}

func (s *CheckoutService) GetPopularBooks(limit int) ([]models.PopularBook, error) {
    return s.checkoutRepo.GetPopularBooks(limit)
}

func (s *CheckoutService) GetUserStats(userID uint) (*repositories.UserStats, error) {
    return s.checkoutRepo.GetUserStats(userID)
}
