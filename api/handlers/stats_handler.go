package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "library-management/services"
)

type StatsHandler struct {
    checkoutService *services.CheckoutService
}

func NewStatsHandler(checkoutService *services.CheckoutService) *StatsHandler {
    return &StatsHandler{
        checkoutService: checkoutService,
    }
}

func (h *StatsHandler) GetStatsOverview(c *gin.Context) {
    stats, err := h.checkoutService.GetStatsOverview()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
        return
    }
    
    c.JSON(http.StatusOK, stats)
}

func (h *StatsHandler) GetMonthlyStats(c *gin.Context) {
    yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
    year, err := strconv.Atoi(yearStr)
    if err != nil {
        year = time.Now().Year()
    }
    
    monthStr := c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month())))
    month, err := strconv.Atoi(monthStr)
    if err != nil || month < 1 || month > 12 {
        month = int(time.Now().Month())
    }
    
    stats, err := h.checkoutService.GetMonthlyStats(year, month)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monthly statistics"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "year":  year,
        "month": month,
        "stats": stats,
    })
}

func (h *StatsHandler) GetPopularBooks(c *gin.Context) {
    limitStr := c.DefaultQuery("limit", "10")
    limit, err := strconv.Atoi(limitStr)
    if err != nil || limit < 1 || limit > 50 {
        limit = 10
    }
    
    books, err := h.checkoutService.GetPopularBooks(limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch popular books"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"books": books})
}

func (h *StatsHandler) GetUserStats(c *gin.Context) {
    userIDStr := c.Param("user_id")
    userID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    stats, err := h.checkoutService.GetUserStats(uint(userID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user statistics"})
        return
    }
    
    c.JSON(http.StatusOK, stats)
}
