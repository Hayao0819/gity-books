package repositories

import (
    "errors"
    "time"
    "gorm.io/gorm"
    "library-management/models"
)

type checkoutRepository struct {
    db *gorm.DB
}

// NewCheckoutRepository creates a new checkout repository
func NewCheckoutRepository(db *gorm.DB) CheckoutRepository {
    return &checkoutRepository{db: db}
}

func (r *checkoutRepository) Create(checkout *models.Checkout) error {
    return r.db.Create(checkout).Error
}

func (r *checkoutRepository) GetByID(id uint) (*models.Checkout, error) {
    var checkout models.Checkout
    if err := r.db.Preload("Book").Preload("User").Where("id = ?", id).First(&checkout).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("checkout not found")
        }
        return nil, err
    }
    return &checkout, nil
}

func (r *checkoutRepository) Update(checkout *models.Checkout) error {
    return r.db.Save(checkout).Error
}

func (r *checkoutRepository) Delete(id uint) error {
    return r.db.Delete(&models.Checkout{}, id).Error
}

func (r *checkoutRepository) List(filter CheckoutFilter) ([]models.Checkout, int64, error) {
    var checkouts []models.Checkout
    var total int64
    
    query := r.db.Model(&models.Checkout{}).Preload("Book").Preload("User")
    
    // Apply filters
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    if filter.UserID != 0 {
        query = query.Where("user_id = ?", filter.UserID)
    }
    if filter.BookID != 0 {
        query = query.Where("book_id = ?", filter.BookID)
    }
    
    // Get total count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    // Apply pagination
    offset := (filter.Page - 1) * filter.Limit
    if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&checkouts).Error; err != nil {
        return nil, 0, err
    }
    
    return checkouts, total, nil
}

func (r *checkoutRepository) GetByUserID(userID uint, filter CheckoutFilter) ([]models.Checkout, int64, error) {
    var checkouts []models.Checkout
    var total int64
    
    query := r.db.Model(&models.Checkout{}).Preload("Book").Where("user_id = ?", userID)
    
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    
    // Get total count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    // Apply pagination
    offset := (filter.Page - 1) * filter.Limit
    if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&checkouts).Error; err != nil {
        return nil, 0, err
    }
    
    return checkouts, total, nil
}

func (r *checkoutRepository) GetOverdue() ([]models.Checkout, int64, error) {
    var checkouts []models.Checkout
    var total int64
    
    query := r.db.Model(&models.Checkout{}).
        Preload("Book").
        Preload("User").
        Where("status = ? AND due_date < ?", models.CheckoutStatusBorrowed, time.Now())
    
    // Get total count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    if err := query.Order("due_date ASC").Find(&checkouts).Error; err != nil {
        return nil, 0, err
    }
    
    return checkouts, total, nil
}

func (r *checkoutRepository) GetActiveByUserID(userID uint) (int64, error) {
    var count int64
    err := r.db.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        userID, models.CheckoutStatusBorrowed).Count(&count).Error
    return count, err
}

func (r *checkoutRepository) GetActiveByBookID(bookID uint) (int64, error) {
    var count int64
    err := r.db.Model(&models.Checkout{}).Where("book_id = ? AND status = ?", 
        bookID, models.CheckoutStatusBorrowed).Count(&count).Error
    return count, err
}

func (r *checkoutRepository) GetMonthlyStats(year, month int) ([]models.MonthlyStats, error) {
    startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
    endDate := startDate.AddDate(0, 1, 0)
    
    var monthlyStats []models.MonthlyStats
    
    // Get daily checkout counts
    var checkoutStats []struct {
        Date  time.Time `json:"date"`
        Count int64     `json:"count"`
    }
    
    if err := r.db.Model(&models.Checkout{}).
        Select("DATE(borrowed_date) as date, COUNT(*) as count").
        Where("borrowed_date >= ? AND borrowed_date < ?", startDate, endDate).
        Group("DATE(borrowed_date)").
        Order("date").
        Scan(&checkoutStats).Error; err != nil {
        return nil, err
    }
    
    // Get daily return counts
    var returnStats []struct {
        Date  time.Time `json:"date"`
        Count int64     `json:"count"`
    }
    
    if err := r.db.Model(&models.Checkout{}).
        Select("DATE(return_date) as date, COUNT(*) as count").
        Where("return_date >= ? AND return_date < ? AND status = ?", startDate, endDate, models.CheckoutStatusReturned).
        Group("DATE(return_date)").
        Order("date").
        Scan(&returnStats).Error; err != nil {
        return nil, err
    }
    
    // Merge data by date
    statsMap := make(map[string]*models.MonthlyStats)
    
    for _, stat := range checkoutStats {
        dateStr := stat.Date.Format("2006-01-02")
        if _, exists := statsMap[dateStr]; !exists {
            statsMap[dateStr] = &models.MonthlyStats{
                Month: dateStr,
            }
        }
        statsMap[dateStr].Checkouts = stat.Count
    }
    
    for _, stat := range returnStats {
        dateStr := stat.Date.Format("2006-01-02")
        if _, exists := statsMap[dateStr]; !exists {
            statsMap[dateStr] = &models.MonthlyStats{
                Month: dateStr,
            }
        }
        statsMap[dateStr].Returns = stat.Count
    }
    
    // Convert map to slice
    for _, stats := range statsMap {
        monthlyStats = append(monthlyStats, *stats)
    }
    
    return monthlyStats, nil
}

func (r *checkoutRepository) GetPopularBooks(limit int) ([]models.PopularBook, error) {
    var popularBooks []models.PopularBook
    
    if err := r.db.Model(&models.Checkout{}).
        Select("books.id, books.title, books.author, COUNT(checkouts.id) as checkout_count").
        Joins("JOIN books ON books.id = checkouts.book_id").
        Group("books.id, books.title, books.author").
        Order("checkout_count DESC").
        Limit(limit).
        Scan(&popularBooks).Error; err != nil {
        return nil, err
    }
    
    return popularBooks, nil
}

func (r *checkoutRepository) GetUserStats(userID uint) (*UserStats, error) {
    var stats UserStats
    
    // Total checkouts
    if err := r.db.Model(&models.Checkout{}).Where("user_id = ?", userID).Count(&stats.TotalCheckouts).Error; err != nil {
        return nil, err
    }
    
    // Active checkouts
    if err := r.db.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        userID, models.CheckoutStatusBorrowed).Count(&stats.ActiveCheckouts).Error; err != nil {
        return nil, err
    }
    
    // Overdue checkouts
    if err := r.db.Model(&models.Checkout{}).Where("user_id = ? AND status = ? AND due_date < ?", 
        userID, models.CheckoutStatusBorrowed, time.Now()).Count(&stats.OverdueCheckouts).Error; err != nil {
        return nil, err
    }
    
    // Returned books
    if err := r.db.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        userID, models.CheckoutStatusReturned).Count(&stats.ReturnedBooks).Error; err != nil {
        return nil, err
    }
    
    return &stats, nil
}

func (r *checkoutRepository) GetMonthlyCheckoutCount() (int64, error) {
    now := time.Now()
    startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
    
    var count int64
    err := r.db.Model(&models.Checkout{}).Where("borrowed_date >= ?", startOfMonth).Count(&count).Error
    return count, err
}

func (r *checkoutRepository) GetOverdueCount() (int64, error) {
    var count int64
    err := r.db.Model(&models.Checkout{}).Where("status = ? AND due_date < ?", 
        models.CheckoutStatusBorrowed, time.Now()).Count(&count).Error
    return count, err
}
