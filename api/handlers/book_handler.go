package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "library-management/models"
    "library-management/repositories"
    "library-management/services"
)

type BookHandler struct {
    bookService *services.BookService
}

func NewBookHandler(bookService *services.BookService) *BookHandler {
    return &BookHandler{
        bookService: bookService,
    }
}

func (h *BookHandler) GetBooks(c *gin.Context) {
    search := c.Query("search")
    status := c.Query("status")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    filter := repositories.BookFilter{
        Search: search,
        Status: status,
        Page:   page,
        Limit:  limit,
    }
    
    books, total, err := h.bookService.ListBooks(filter)
    if err != nil {
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

func (h *BookHandler) GetBook(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
        return
    }
    
    book, err := h.bookService.GetBookByID(uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": book})
}

func (h *BookHandler) CreateBook(c *gin.Context) {
    var req models.CreateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    book, err := h.bookService.CreateBook(&req)
    if err != nil {
        if err.Error() == "book with this ISBN already exists" {
            c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"book": book})
}

func (h *BookHandler) UpdateBook(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
        return
    }
    
    var req models.UpdateBookRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    book, err := h.bookService.UpdateBook(uint(id), &req)
    if err != nil {
        if err.Error() == "book not found" {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else if err.Error() == "book with this ISBN already exists" {
            c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": book})
}

func (h *BookHandler) DeleteBook(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
        return
    }
    
    err = h.bookService.DeleteBook(uint(id))
    if err != nil {
        if err.Error() == "book not found" {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else if err.Error() == "cannot delete borrowed book" || err.Error() == "cannot delete book with active checkouts" {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}

func (h *BookHandler) UpdateBookStatus(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
        return
    }
    
    var req struct {
        Status string `json:"status" binding:"required,oneof=available borrowed maintenance"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    book, err := h.bookService.UpdateBookStatus(uint(id), req.Status)
    if err != nil {
        if err.Error() == "book not found" {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        }
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"book": book})
}
