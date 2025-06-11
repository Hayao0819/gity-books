package repositories

import (
    "errors"
    "gorm.io/gorm"
    "library-management/models"
)

type bookRepository struct {
    db *gorm.DB
}

// NewBookRepository creates a new book repository
func NewBookRepository(db *gorm.DB) BookRepository {
    return &bookRepository{db: db}
}

func (r *bookRepository) Create(book *models.Book) error {
    return r.db.Create(book).Error
}

func (r *bookRepository) GetByID(id uint) (*models.Book, error) {
    var book models.Book
    if err := r.db.Preload("Checkouts.User").Where("id = ?", id).First(&book).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("book not found")
        }
        return nil, err
    }
    return &book, nil
}

func (r *bookRepository) GetByISBN(isbn string) (*models.Book, error) {
    var book models.Book
    if err := r.db.Where("isbn = ?", isbn).First(&book).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("book not found")
        }
        return nil, err
    }
    return &book, nil
}

func (r *bookRepository) Update(book *models.Book) error {
    return r.db.Save(book).Error
}

func (r *bookRepository) Delete(id uint) error {
    return r.db.Delete(&models.Book{}, id).Error
}

func (r *bookRepository) List(filter BookFilter) ([]models.Book, int64, error) {
    var books []models.Book
    var total int64
    
    query := r.db.Model(&models.Book{})
    
    // Apply search filter
    if filter.Search != "" {
        searchPattern := "%" + filter.Search + "%"
        query = query.Where("title ILIKE ? OR author ILIKE ? OR isbn ILIKE ?", 
            searchPattern, searchPattern, searchPattern)
    }
    
    // Apply status filter
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    
    // Get total count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    // Apply pagination
    offset := (filter.Page - 1) * filter.Limit
    if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&books).Error; err != nil {
        return nil, 0, err
    }
    
    return books, total, nil
}

func (r *bookRepository) UpdateStatus(id uint, status string) error {
    return r.db.Model(&models.Book{}).Where("id = ?", id).Update("status", status).Error
}

func (r *bookRepository) GetAvailableCount() (int64, error) {
    var count int64
    err := r.db.Model(&models.Book{}).Where("status = ?", models.BookStatusAvailable).Count(&count).Error
    return count, err
}

func (r *bookRepository) GetBorrowedCount() (int64, error) {
    var count int64
    err := r.db.Model(&models.Book{}).Where("status = ?", models.BookStatusBorrowed).Count(&count).Error
    return count, err
}

func (r *bookRepository) GetTotalCount() (int64, error) {
    var count int64
    err := r.db.Model(&models.Book{}).Count(&count).Error
    return count, err
}
