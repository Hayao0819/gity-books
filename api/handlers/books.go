package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    
    "library-management/database"
    "library-management/models"
)

func GetBooks(c *gin.Context) {
    search := c.Query("search")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    status := c.Query("status")
    offset := (page - 1) * limit
    
    var books []models.Book
    var total int64
    
    query := database.DB.Model(&models.Book{})
    
    // 検索条件の追加
    if search != "" {
        searchPattern := "%" + search + "%"
        query = query.Where("title ILIKE ? OR author ILIKE ? OR isbn ILIKE ?", 
            searchPattern, searchPattern, searchPattern)
    }
    
    // ステータスフィルター
    if status != "" {
        query = query.Where("status = ?", status)
    }
    
    // 総数を取得
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count books"})
        return
    }
    
    // ページネーション付きでデータを取得
    if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&books).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "books": books,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func GetBook(c *gin.Context) {
    id := c.Param("id")
    
    var book models.Book
    if err := database.DB.Preload("Checkouts.User").Where("id = ?", id).First(&book).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": book})
}

func CreateBook(c *gin.Context) {
    var req models.CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // ISBNの重複チェック（ISBNが提供されている場合）
    if req.ISBN != "" {
        var existingBook models.Book
        if err := database.DB.Where("isbn = ?", req.ISBN).First(&existingBook).Error; err == nil {
            c.JSON(http.StatusConflict, gin.H{"error": "Book with this ISBN already exists"})
            return
        }
    }
    
    book := models.Book{
        Title:         req.Title,
        Author:        req.Author,
        ISBN:          req.ISBN,
        Publisher:     req.Publisher,
        PublishedYear: req.PublishedYear,
        Description:   req.Description,
        Status:        models.BookStatusAvailable,
    }
    
    if err := database.DB.Create(&book).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"book": book})
}

func UpdateBook(c *gin.Context) {
    id := c.Param("id")
    
    var book models.Book
    if err := database.DB.Where("id = ?", id).First(&book).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
        }
        return
    }
    
    var req models.UpdateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // ISBNの重複チェック（ISBNが変更されている場合）
    if req.ISBN != "" && req.ISBN != book.ISBN {
        var existingBook models.Book
        if err := database.DB.Where("isbn = ? AND id != ?", req.ISBN, id).First(&existingBook).Error; err == nil {
            c.JSON(http.StatusConflict, gin.H{"error": "Book with this ISBN already exists"})
            return
        }
    }
    
    // 本の情報を更新
    updates := models.Book{
        Title:         req.Title,
        Author:        req.Author,
        ISBN:          req.ISBN,
        Publisher:     req.Publisher,
        PublishedYear: req.PublishedYear,
        Description:   req.Description,
    }
    
    if err := database.DB.Model(&book).Updates(updates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
        return
    }
    
    // 更新された本の情報を取得
    if err := database.DB.Where("id = ?", id).First(&book).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated book"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": book})
}

func DeleteBook(c *gin.Context) {
    id := c.Param("id")
    
    var book models.Book
    if err := database.DB.Where("id = ?", id).First(&book).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
        }
        return
    }
    
    // 貸出中の本は削除できない
    if book.Status == models.BookStatusBorrowed {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete borrowed book"})
        return
    }
    
    // アクティブな貸出記録があるかチェック
    var activeCheckouts int64
    if err := database.DB.Model(&models.Checkout{}).Where("book_id = ? AND status = ?", 
        id, models.CheckoutStatusBorrowed).Count(&activeCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check active checkouts"})
        return
    }
    
    if activeCheckouts > 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete book with active checkouts"})
        return
    }
    
    // ソフトデリート
    if err := database.DB.Delete(&book).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

func UpdateBookStatus(c *gin.Context) {
    id := c.Param("id")
    
    var req struct {
        Status string `json:"status" binding:"required,oneof=available borrowed maintenance"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var book models.Book
    if err := database.DB.Where("id = ?", id).First(&book).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
        }
        return
    }
    
    // ステータスの更新
    if err := database.DB.Model(&book).Update("status", req.Status).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book status"})
        return
    }
    
    book.Status = req.Status
    c.JSON(http.StatusOK, gin.H{"book": book})
}
