package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "library-management/models"
    "library-management/utils"
)

func GetStatsOverview(c *gin.Context) {
    var stats models.StatsOverview
    
    // Total books
    var totalBooksResult []map[string]interface{}
    _, err := utils.SupabaseClient.From("books").Select("count", true).Execute(&totalBooksResult)
    if err == nil && len(totalBooksResult) > 0 {
        if count, ok := totalBooksResult[0]["count"].(float64); ok {
            stats.TotalBooks = int64(count)
        }
    }
    
    // Borrowed books
    var borrowedBooksResult []map[string]interface{}
    _, err = utils.SupabaseClient.From("books").Select("count", true).Eq("status", "borrowed").Execute(&borrowedBooksResult)
    if err == nil && len(borrowedBooksResult) > 0 {
        if count, ok := borrowedBooksResult[0]["count"].(float64); ok {
            stats.BorrowedBooks = int64(count)
        }
    }
    
    // Monthly checkouts (current month)
    now := time.Now()
    startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
    var monthlyCheckoutsResult []map[string]interface{}
    _, err = utils.SupabaseClient.From("checkouts").Select("count", true).Gte("borrowed_date", startOfMonth.Format(time.RFC3339)).Execute(&monthlyCheckoutsResult)
    if err == nil && len(monthlyCheckoutsResult) > 0 {
        if count, ok := monthlyCheckoutsResult[0]["count"].(float64); ok {
            stats.MonthlyCheckouts = int64(count)
        }
    }
    
    // Overdue books
    var overdueBooksResult []map[string]interface{}
    _, err = utils.SupabaseClient.From("checkouts").Select("count", true).Eq("status", "borrowed").Lt("due_date", now.Format(time.RFC3339)).Execute(&overdueBooksResult)
    if err == nil && len(overdueBooksResult) > 0 {
        if count, ok := overdueBooksResult[0]["count"].(float64); ok {
            stats.OverdueBooks = int64(count)
        }
    }
    
    c.JSON(http.StatusOK, stats)
}

func GetMonthlyStats(c *gin.Context) {
    year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
    month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
    
    startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
    endDate := startDate.AddDate(0, 1, 0)
    
    // Get daily checkout counts
    var checkouts []struct {
        Date  string `json:"date"`
        Count int64  `json:"count"`
    }
    
    // Note: This would require a more complex query in Supabase
    // For now, return empty arrays
    var returns []struct {
        Date  string `json:"date"`
        Count int64  `json:"count"`
    }
    
    c.JSON(http.StatusOK, gin.H{
        "checkouts": checkouts,
        "returns":   returns,
    })
}

func GetPopularBooks(c *gin.Context) {
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    
    var popularBooks []models.PopularBook
    
    // Note: This would require a more complex query with joins and aggregations
    // For now, return empty array
    _ = limit
    
    c.JSON(http.StatusOK, gin.H{"books": popularBooks})
}
