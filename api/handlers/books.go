package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "library-management/models"
    "library-management/utils"
)

func GetBooks(c *gin.Context) {
    search := c.Query("search")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset := (page - 1) * limit
    
    var books []models.Book
    var err error
    
    query := utils.SupabaseClient.From("books").Select("*")
    
    if search != "" {
        query = query.Or("title.ilike.%"+search+"%,author.ilike.%"+search+"%,isbn.ilike.%"+search+"%")
    }
    
    _, err = query.Range(offset, offset+limit-1).Execute(&books)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books"})
        return
    }
    
    // Get total count
    var totalCount []map[string]interface{}
    countQuery := utils.SupabaseClient.From("books").Select("count", true)
    if search != "" {
        countQuery = countQuery.Or("title.ilike.%"+search+"%,author.ilike.%"+search+"%,isbn.ilike.%"+search+"%")
    }
    _, err = countQuery.Execute(&totalCount)
    
    total := int64(0)
    if len(totalCount) > 0 {
        if count, ok := totalCount[0]["count"].(float64); ok {
            total = int64(count)
        }
    }
    
    c.JSON(http.StatusOK, gin.H{
        "books": books,
        "total": total,
        "page":  page,
        "limit": limit,
    })
}

func GetBook(c *gin.Context) {
    id := c.Param("id")
    
    var books []models.Book
    _, err := utils.SupabaseClient.From("books").Select("*").Eq("id", id).Execute(&books)
    if err != nil || len(books) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": books[0]})
}

func CreateBook(c *gin.Context) {
    var req models.CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    book := map[string]interface{}{
        "title":          req.Title,
        "author":         req.Author,
        "isbn":           req.ISBN,
        "publisher":      req.Publisher,
        "published_year": req.PublishedYear,
        "description":    req.Description,
        "status":         "available",
        "created_at":     time.Now(),
        "updated_at":     time.Now(),
    }
    
    var result []models.Book
    _, err := utils.SupabaseClient.From("books").Insert(book).Execute(&result)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
        return
    }
    
    if len(result) > 0 {
        c.JSON(http.StatusCreated, gin.H{"book": result[0]})
    } else {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
    }
}

func UpdateBook(c *gin.Context) {
    id := c.Param("id")
    
    var req models.CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    updates := map[string]interface{}{
        "title":          req.Title,
        "author":         req.Author,
        "isbn":           req.ISBN,
        "publisher":      req.Publisher,
        "published_year": req.PublishedYear,
        "description":    req.Description,
        "updated_at":     time.Now(),
    }
    
    var result []models.Book
    _, err := utils.SupabaseClient.From("books").Update(updates).Eq("id", id).Execute(&result)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
        return
    }
    
    if len(result) > 0 {
        c.JSON(http.StatusOK, gin.H{"book": result[0]})
    } else {
        c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
    }
}

func DeleteBook(c *gin.Context) {
    id := c.Param("id")
    
    _, err := utils.SupabaseClient.From("books").Delete().Eq("id", id).Execute(nil)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"success": true})
}
