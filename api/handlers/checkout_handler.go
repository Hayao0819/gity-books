package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "library-management/models"
    "library-management/repositories"
    "library-management/services"
)

type CheckoutHandler struct {
    checkoutService *services.CheckoutService
}

func NewCheckoutHandler(checkoutService *services.CheckoutService) *CheckoutHandler {
    return &CheckoutHandler{
        checkoutService: checkoutService,
    }
}

func (h *CheckoutHandler) GetCheckouts(c *gin.Context) {
    status := c.Query("status")
    userIDStr := c.Query("user_id")
    bookIDStr := c.Query("book_id")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    filter := repositories.CheckoutFilter{
        Status: status,
        Page:   page,
        Limit:  limit,
    }
    
    if userIDStr != "" {
        userID, err := strconv.ParseUint(userIDStr, 10, 32)
        if err == nil {
            filter.UserID = uint(userID)
        }
    }
    
    if bookIDStr != "" {
        bookID, err := strconv.ParseUint(bookIDStr, 10, 32)
        if err == nil {
            filter.BookID = uint(bookID)
        }
    }
    
    checkouts, total, err := h.checkoutService.ListCheckouts(filter)
    if err != nil {
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

func (h *CheckoutHandler) CreateCheckout(c *gin.Context) {
    var req models.CreateCheckoutRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    checkout, err := h.checkoutService.CreateCheckout(&req)
    if err != nil {
        if err.Error() == "book not found" || err.Error() == "user not found" {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else if err.Error() == "book is not available for checkout" || err.Error() == "user has reached maximum checkout limit (5 books)" {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"checkout": checkout})
}

func (h *CheckoutHandler) ReturnBook(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid checkout ID"})
        return
    }
    
    var req models.ReturnBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // If request body is empty, use current time
        now := time.Now()
        req.ReturnDate = &now
    }
    
    checkout, err := h.checkoutService.ReturnBook(uint(id), req.ReturnDate)
    if err != nil {
        if err.Error() == "checkout not found" {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else if err.Error() == "checkout is not active" {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"checkout": checkout})
}

func (h *CheckoutHandler) GetOverdueCheckouts(c *gin.Context) {
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    checkouts, total, err := h.checkoutService.GetOverdueCheckouts()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch overdue checkouts"})
        return
    }
    
    // Apply pagination manually since the repository method doesn't support it
    startIndex := (page - 1) * limit
    endIndex := startIndex + limit
    
    if startIndex >= int(total) {
        c.JSON(http.StatusOK, gin.H{
            "checkouts": []models.Checkout{},
            "pagination": gin.H{
                "total":       total,
                "page":        page,
                "limit":       limit,
                "total_pages": (total + int64(limit) - 1) / int64(limit),
            },
        })
        return
    }
    
    if endIndex > int(total) {
        endIndex = int(total)
    }
    
    pagedCheckouts := checkouts[startIndex:endIndex]
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": pagedCheckouts,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *CheckoutHandler) GetUserCheckouts(c *gin.Context) {
    userIDStr := c.Param("user_id")
    userID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    status := c.Query("status")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    filter := repositories.CheckoutFilter{
        Status: status,
        Page:   page,
        Limit:  limit,
    }
    
    checkouts, total, err := h.checkoutService.GetUserCheckouts(uint(userID), filter)
    if err != nil {
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
