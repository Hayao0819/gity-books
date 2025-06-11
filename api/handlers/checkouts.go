package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    
    "library-management/database"
    "library-management/models"
)

func GetCheckouts(c *gin.Context) {
    status := c.Query("status")
    userID := c.Query("user_id")
    bookID := c.Query("book_id")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    offset := (page - 1) * limit
    
    var checkouts []models.Checkout
    var total int64
    
    query := database.DB.Model(&models.Checkout{}).Preload("Book").Preload("User")
    
    // フィルター条件の追加
    if status != "" {
        query = query.Where("status = ?", status)
    }
    if userID != "" {
        query = query.Where("user_id = ?", userID)
    }
    if bookID != "" {
        query = query.Where("book_id = ?", bookID)
    }
    
    // 総数を取得
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count checkouts"})
        return
    }
    
    // ページネーション付きでデータを取得
    if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&checkouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkouts"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func CreateCheckout(c *gin.Context) {
    var req models.CreateCheckoutRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // トランザクション開始
    tx := database.DB.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()
    
    // 本の存在確認と利用可能性チェック
    var book models.Book
    if err := tx.Where("id = ?", req.BookID).First(&book).Error; err != nil {
        tx.Rollback()
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book"})
        }
        return
    }
    
    if book.Status != models.BookStatusAvailable {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{"error": "Book is not available for checkout"})
        return
    }
    
    // ユーザーの存在確認
    var user models.User
    if err := tx.Where("id = ?", req.UserID).First(&user).Error; err != nil {
        tx.Rollback()
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
        }
        return
    }
    
    // ユーザーの貸出制限チェック（最大5冊まで）
    var activeCheckouts int64
    if err := tx.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        req.UserID, models.CheckoutStatusBorrowed).Count(&activeCheckouts).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user's active checkouts"})
        return
    }
    
    if activeCheckouts >= 5 {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{"error": "User has reached maximum checkout limit (5 books)"})
        return
    }
    
    // 返却期限の設定（デフォルト2週間）
    dueDate := time.Now().AddDate(0, 0, 14)
    if req.DueDate != nil {
        dueDate = *req.DueDate
    }
    
    // 貸出記録の作成
    checkout := models.Checkout{
        BookID:       req.BookID,
        UserID:       req.UserID,
        BorrowedDate: time.Now(),
        DueDate:      dueDate,
        Status:       models.CheckoutStatusBorrowed,
    }
    
    if err := tx.Create(&checkout).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout"})
        return
    }
    
    // 本のステータスを「貸出中」に更新
    if err := tx.Model(&book).Update("status", models.BookStatusBorrowed).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book status"})
        return
    }
    
    // トランザクションをコミット
    if err := tx.Commit().Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
        return
    }
    
    // 作成された貸出記録を関連データと共に取得
    if err := database.DB.Preload("Book").Preload("User").Where("id = ?", checkout.ID).First(&checkout).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created checkout"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"checkout": checkout})
}

func ReturnBook(c *gin.Context) {
    id := c.Param("id")
    
    var req models.ReturnBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // リクエストボディが空の場合は現在時刻を使用
        now := time.Now()
        req.ReturnDate = &now
    }
    
    if req.ReturnDate == nil {
        now := time.Now()
        req.ReturnDate = &now
    }
    
    // トランザクション開始
    tx := database.DB.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()
    
    // 貸出記録の取得
    var checkout models.Checkout
    if err := tx.Preload("Book").Where("id = ? AND status = ?", id, models.CheckoutStatusBorrowed).First(&checkout).Error; err != nil {
        tx.Rollback()
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Active checkout not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkout"})
        }
        return
    }
    
    // 貸出記録の更新
    updates := map[string]interface{}{
        "return_date": req.ReturnDate,
        "status":      models.CheckoutStatusReturned,
    }
    
    if err := tx.Model(&checkout).Updates(updates).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update checkout"})
        return
    }
    
    // 本のステータスを「利用可能」に更新
    if err := tx.Model(&checkout.Book).Update("status", models.BookStatusAvailable).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book status"})
        return
    }
    
    // トランザクションをコミット
    if err := tx.Commit().Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
        return
    }
    
    // 更新された貸出記録を取得
    if err := database.DB.Preload("Book").Preload("User").Where("id = ?", checkout.ID).First(&checkout).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated checkout"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"checkout": checkout})
}

func GetOverdueCheckouts(c *gin.Context) {
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    offset := (page - 1) * limit
    
    var checkouts []models.Checkout
    var total int64
    
    query := database.DB.Model(&models.Checkout{}).
        Preload("Book").
        Preload("User").
        Where("status = ? AND due_date < ?", models.CheckoutStatusBorrowed, time.Now())
    
    // 総数を取得
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count overdue checkouts"})
        return
    }
    
    // ページネーション付きでデータを取得
    if err := query.Offset(offset).Limit(limit).Order("due_date ASC").Find(&checkouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch overdue checkouts"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func GetUserCheckouts(c *gin.Context) {
    userID := c.Param("user_id")
    status := c.Query("status")
    
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    offset := (page - 1) * limit
    
    var checkouts []models.Checkout
    var total int64
    
    query := database.DB.Model(&models.Checkout{}).
        Preload("Book").
        Where("user_id = ?", userID)
    
    if status != "" {
        query = query.Where("status = ?", status)
    }
    
    // 総数を取得
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count user checkouts"})
        return
    }
    
    // ページネーション付きでデータを取得
    if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&checkouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user checkouts"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}
