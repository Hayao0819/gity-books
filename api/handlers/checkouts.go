package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "library-management/models"
    "library-management/utils"
)

func GetCheckouts(c *gin.Context) {
    status := c.Query("status")
    userID := c.Query("userId")
    bookID := c.Query("bookId")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset := (page - 1) * limit
    
    query := utils.SupabaseClient.From("checkouts").Select(`
        *,
        books:book_id(*),
        users:user_id(*)
    `)
    
    if status != "" {
        query = query.Eq("status", status)
    }
    if userID != "" {
        query = query.Eq("user_id", userID)
    }
    if bookID != "" {
        query = query.Eq("book_id", bookID)
    }
    
    var checkouts []models.Checkout
    _, err := query.Range(offset, offset+limit-1).Execute(&checkouts)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkouts"})
        return
    }
    
    // Get total count
    var totalCount []map[string]interface{}
    countQuery := utils.SupabaseClient.From("checkouts").Select("count", true)
    if status != "" {
        countQuery = countQuery.Eq("status", status)
    }
    if userID != "" {
        countQuery = countQuery.Eq("user_id", userID)
    }
    if bookID != "" {
        countQuery = countQuery.Eq("book_id", bookID)
    }
    _, err = countQuery.Execute(&totalCount)
    
    total := int64(0)
    if len(totalCount) > 0 {
        if count, ok := totalCount[0]["count"].(float64); ok {
            total = int64(count)
        }
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "total":     total,
        "page":      page,
        "limit":     limit,
    })
}

func CreateCheckout(c *gin.Context) {
    var req models.CreateCheckoutRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Check if book is available
    var books []models.Book
    _, err := utils.SupabaseClient.From("books").Select("*").Eq("id", req.BookID).Eq("status", "available").Execute(&books)
    if err != nil || len(books) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Book not available"})
        return
    }
    
    // Check if user exists
    var users []models.User
    _, err = utils.SupabaseClient.From("users").Select("*").Eq("id", req.UserID).Execute(&users)
    if err != nil || len(users) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
        return
    }
    
    // Set due date (default 2 weeks from now)
    dueDate := time.Now().AddDate(0, 0, 14)
    if req.DueDate != nil {
        dueDate = *req.DueDate
    }
    
    checkout := map[string]interface{}{
        "book_id":       req.BookID,
        "user_id":       req.UserID,
        "borrowed_date": time.Now(),
        "due_date":      dueDate,
        "status":        "borrowed",
        "created_at":    time.Now(),
        "updated_at":    time.Now(),
    }
    
    // Create checkout
    var result []models.Checkout
    _, err = utils.SupabaseClient.From("checkouts").Insert(checkout).Execute(&result)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout"})
        return
    }
    
    // Update book status
    bookUpdate := map[string]interface{}{
        "status":     "borrowed",
        "updated_at": time.Now(),
    }
    _, err = utils.SupabaseClient.From("books").Update(bookUpdate).Eq("id", req.BookID).Execute(nil)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book status"})
        return
    }
    
    if len(result) > 0 {
        c.JSON(http.StatusCreated, gin.H{"checkout": result[0]})
    } else {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout"})
    }
}

func ReturnBook(c *gin.Context) {
    id := c.Param("id")
    
    var req models.ReturnBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // If no body provided, use current time
        now := time.Now()
        req.ReturnDate = &now
    }
    
    if req.ReturnDate == nil {
        now := time.Now()
        req.ReturnDate = &now
    }
    
    // Get checkout
    var checkouts []models.Checkout
    _, err := utils.SupabaseClient.From("checkouts").Select("*").Eq("id", id).Eq("status", "borrowed").Execute(&checkouts)
    if err != nil || len(checkouts) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Active checkout not found"})
        return
    }
    
    checkout := checkouts[0]
    
    // Update checkout
    checkoutUpdate := map[string]interface{}{
        "return_date": req.ReturnDate,
        "status":      "returned",
        "updated_at":  time.Now(),
    }
    
    var result []models.Checkout
    _, err = utils.SupabaseClient.From("checkouts").Update(checkoutUpdate).Eq("id", id).Execute(&result)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update checkout"})
        return
    }
    
    // Update book status
    bookUpdate := map[string]interface{}{
        "status":     "available",
        "updated_at": time.Now(),
    }
    _, err = utils.SupabaseClient.From("books").Update(bookUpdate).Eq("id", checkout.BookID).Execute(nil)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book status"})
        return
    }
    
    if len(result) > 0 {
        c.JSON(http.StatusOK, gin.H{"checkout": result[0]})
    } else {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to return book"})
    }
}

func GetOverdueCheckouts(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset := (page - 1) * limit
    
    var checkouts []models.Checkout
    _, err := utils.SupabaseClient.From("checkouts").Select(`
        *,
        books:book_id(*),
        users:user_id(*)
    `).Eq("status", "borrowed").Lt("due_date", time.Now().Format(time.RFC3339)).Range(offset, offset+limit-1).Execute(&checkouts)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch overdue checkouts"})
        return
    }
    
    // Get total count
    var totalCount []map[string]interface{}
    _, err = utils.SupabaseClient.From("checkouts").Select("count", true).Eq("status", "borrowed").Lt("due_date", time.Now().Format(time.RFC3339)).Execute(&totalCount)
    
    total := int64(0)
    if len(totalCount) > 0 {
        if count, ok := totalCount[0]["count"].(float64); ok {
            total = int64(count)
        }
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "total":     total,
        "page":      page,
        "limit":     limit,
    })
}
