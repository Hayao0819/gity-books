package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "library-management/database"
    "library-management/models"
)

func GetUsers(c *gin.Context) {
    var users []models.User
    query := database.DB.Model(&models.User{})
    
    // Search functionality
    if search := c.Query("search"); search != "" {
        query = query.Where("name ILIKE ? OR email ILIKE ? OR student_id ILIKE ?", 
            "%"+search+"%", "%"+search+"%", "%"+search+"%")
    }
    
    // Filter by role
    if role := c.Query("role"); role != "" {
        query = query.Where("role = ?", role)
    }
    
    // Pagination
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset := (page - 1) * limit
    
    var total int64
    query.Count(&total)
    
    if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "users": users,
        "total": total,
        "page":  page,
        "limit": limit,
    })
}

func GetUser(c *gin.Context) {
    id := c.Param("id")
    
    var user models.User
    if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"user": user})
}

func CreateUser(c *gin.Context) {
    var req models.CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Hash password (simplified)
    hashedPassword := req.Password + "_hashed"
    
    user := models.User{
        Name:      req.Name,
        Email:     req.Email,
        Password:  hashedPassword,
        StudentID: req.StudentID,
        Role:      req.Role,
    }
    
    if user.Role == "" {
        user.Role = "user"
    }
    
    if err := database.DB.Create(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{"user": user})
}

func UpdateUser(c *gin.Context) {
    id := c.Param("id")
    
    var user models.User
    if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    var req models.CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user.Name = req.Name
    user.Email = req.Email
    if req.Password != "" {
        user.Password = req.Password + "_hashed"
    }
    user.StudentID = req.StudentID
    if req.Role != "" {
        user.Role = req.Role
    }
    
    if err := database.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"user": user})
}

func DeleteUser(c *gin.Context) {
    id := c.Param("id")
    
    if err := database.DB.Where("id = ?", id).Delete(&models.User{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"success": true})
}
