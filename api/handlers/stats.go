package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    
    "library-management/database"
    "library-management/models"
)

func GetStatsOverview(c *gin.Context) {
    var stats models.StatsOverview
    
    // 総蔵書数
    if err := database.DB.Model(&models.Book{}).Count(&stats.TotalBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count total books"})
        return
    }
    
    // 利用可能な本の数
    if err := database.DB.Model(&models.Book{}).Where("status = ?", models.BookStatusAvailable).Count(&stats.AvailableBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count available books"})
        return
    }
    
    // 貸出中の本の数
    if err := database.DB.Model(&models.Book{}).Where("status = ?", models.BookStatusBorrowed).Count(&stats.BorrowedBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count borrowed books"})
        return
    }
    
    // 今月の貸出数
    now := time.Now()
    startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
    if err := database.DB.Model(&models.Checkout{}).Where("borrowed_date >= ?", startOfMonth).Count(&stats.MonthlyCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count monthly checkouts"})
        return
    }
    
    // 延滞中の本の数
    if err := database.DB.Model(&models.Checkout{}).Where("status = ? AND due_date < ?", 
        models.CheckoutStatusBorrowed, now).Count(&stats.OverdueBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count overdue books"})
        return
    }
    
    // 総ユーザー数
    if err := database.DB.Model(&models.User{}).Count(&stats.TotalUsers).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count total users"})
        return
    }
    
    c.JSON(http.StatusOK, stats)
}

func GetMonthlyStats(c *gin.Context) {
    year, err := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
    if err != nil {
        year = time.Now().Year()
    }
    
    month, err := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
    if err != nil || month < 1 || month > 12 {
        month = int(time.Now().Month())
    }
    
    startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
    endDate := startDate.AddDate(0, 1, 0)
    
    var monthlyStats []models.MonthlyStats
    
    // 日別の貸出数を取得
    var checkoutStats []struct {
        Date  time.Time `json:"date"`
        Count int64     `json:"count"`
    }
    
    if err := database.DB.Model(&models.Checkout{}).
        Select("DATE(borrowed_date) as date, COUNT(*) as count").
        Where("borrowed_date >= ? AND borrowed_date < ?", startDate, endDate).
        Group("DATE(borrowed_date)").
        Order("date").
        Scan(&checkoutStats).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkout statistics"})
        return
    }
    
    // 日別の返却数を取得
    var returnStats []struct {
        Date  time.Time `json:"date"`
        Count int64     `json:"count"`
    }
    
    if err := database.DB.Model(&models.Checkout{}).
        Select("DATE(return_date) as date, COUNT(*) as count").
        Where("return_date >= ? AND return_date < ? AND status = ?", startDate, endDate, models.CheckoutStatusReturned).
        Group("DATE(return_date)").
        Order("date").
        Scan(&returnStats).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch return statistics"})
        return
    }
    
    // 日付ごとにデータをマージ
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
    
    // マップからスライスに変換
    for _, stats := range statsMap {
        monthlyStats = append(monthlyStats, *stats)
    }
    
    c.JSON(http.StatusOK, gin.H{
        "year":  year,
        "month": month,
        "stats": monthlyStats,
    })
}

func GetPopularBooks(c *gin.Context) {
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 50 {
        limit = 10
    }
    
    var popularBooks []models.PopularBook
    
    if err := database.DB.Model(&models.Checkout{}).
        Select("books.id, books.title, books.author, COUNT(checkouts.id) as checkout_count").
        Joins("JOIN books ON books.id = checkouts.book_id").
        Group("books.id, books.title, books.author").
        Order("checkout_count DESC").
        Limit(limit).
        Scan(&popularBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch popular books"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"books": popularBooks})
}

func GetUserStats(c *gin.Context) {
    userID := c.Param("user_id")
    
    var userStats struct {
        TotalCheckouts   int64 `json:"total_checkouts"`
        ActiveCheckouts  int64 `json:"active_checkouts"`
        OverdueCheckouts int64 `json:"overdue_checkouts"`
        ReturnedBooks    int64 `json:"returned_books"`
    }
    
    // 総貸出数
    if err := database.DB.Model(&models.Checkout{}).Where("user_id = ?", userID).Count(&userStats.TotalCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count total checkouts"})
        return
    }
    
    // アクティブな貸出数
    if err := database.DB.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        userID, models.CheckoutStatusBorrowed).Count(&userStats.ActiveCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count active checkouts"})
        return
    }
    
    // 延滞中の貸出数
    if err := database.DB.Model(&models.Checkout{}).Where("user_id = ? AND status = ? AND due_date < ?", 
        userID, models.CheckoutStatusBorrowed, time.Now()).Count(&userStats.OverdueCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count overdue checkouts"})
        return
    }
    
    // 返却済みの本の数
    if err := database.DB.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        userID, models.CheckoutStatusReturned).Count(&userStats.ReturnedBooks).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count returned books"})
        return
    }
    
    c.JSON(http.StatusOK, userStats)
}
