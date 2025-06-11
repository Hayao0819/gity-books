package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
    
    "library-management/database"
    "library-management/models"
)

func GetUsers(c *gin.Context) {
    search := c.Query("search")
    role := c.Query("role")
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }
    
    limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
    if err != nil || limit < 1 || limit > 100 {
        limit = 10
    }
    
    offset := (page - 1) * limit
    
    var users []models.User
    var total int64
    
    query := database.DB.Model(&models.User{})
    
    // 検索条件の追加
    if search != "" {
        searchPattern := "%" + search + "%"
        query = query.Where("name ILIKE ? OR email ILIKE ? OR student_id ILIKE ?", 
            searchPattern, searchPattern, searchPattern)
    }
    
    // ロールフィルター
    if role != "" {
        query = query.Where("role = ?", role)
    }
    
    // 総数を取得
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
        return
    }
    
    // ページネーション付きでデータを取得
    if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "users": users,
        "pagination": gin.H{
            "total":       total,
            "page":        page,
            "limit":       limit,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func GetUser(c *gin.Context) {
    id := c.Param("id")
    
    var user models.User
    if err := database.DB.Preload("Checkouts.Book").Where("id = ?", id).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
        }
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
    
    // メールアドレスの重複チェック
    var existingUser models.User
    if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
        return
    }
    
    // 学籍番号の重複チェック（学籍番号が提供されている場合）
    if req.StudentID != nil && *req.StudentID != "" {
        if err := database.DB.Where("student_id = ?", *req.StudentID).First(&existingUser).Error; err == nil {
            c.JSON(http.StatusConflict, gin.H{"error": "Student ID already exists"})
            return
        }
    }
    
    // パスワードのハッシュ化
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
        return
    }
    
    user := models.User{
        Name:      req.Name,
        Email:     req.Email,
        Password:  string(hashedPassword),
        StudentID: req.StudentID,
        Role:      req.Role,
    }
    
    if user.Role == "" {
        user.Role = models.UserRoleUser
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
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
        }
        return
    }
    
    var req models.CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // メールアドレスの重複チェック（メールアドレスが変更されている場合）
    if req.Email != user.Email {
        var existingUser models.User
        if err := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
            c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
            return
        }
    }
    
    // 学籍番号の重複チェック（学籍番号が変更されている場合）
    if req.StudentID != nil && *req.StudentID != "" {
        currentStudentID := ""
        if user.StudentID != nil {
            currentStudentID = *user.StudentID
        }
        
        if *req.StudentID != currentStudentID {
            var existingUser models.User
            if err := database.DB.Where("student_id = ? AND id != ?", *req.StudentID, id).First(&existingUser).Error; err == nil {
                c.JSON(http.StatusConflict, gin.H{"error": "Student ID already exists"})
                return
            }
        }
    }
    
    // ユーザー情報の更新
    updates := models.User{
        Name:      req.Name,
        Email:     req.Email,
        StudentID: req.StudentID,
    }
    
    if req.Role != "" {
        updates.Role = req.Role
    }
    
    // パスワードが提供されている場合はハッシュ化して更新
    if req.Password != "" {
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
            return
        }
        updates.Password = string(hashedPassword)
    }
    
    if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
        return
    }
    
    // 更新されたユーザー情報を取得
    if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"user": user})
}

func DeleteUser(c *gin.Context) {
    id := c.Param("id")
    
    var user models.User
    if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
        }
        return
    }
    
    // アクティブな貸出があるかチェック
    var activeCheckouts int64
    if err := database.DB.Model(&models.Checkout{}).Where("user_id = ? AND status = ?", 
        id, models.CheckoutStatusBorrowed).Count(&activeCheckouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check active checkouts"})
        return
    }
    
    if activeCheckouts > 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete user with active checkouts"})
        return
    }
    
    // ソフトデリート
    if err := database.DB.Delete(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func UpdateUserRole(c *gin.Context) {
    id := c.Param("id")
    
    var req struct {
        Role string `json:"role" binding:"required,oneof=user admin"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var user models.User
    if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
        }
        return
    }
    
    // ロールの更新
    if err := database.DB.Model(&user).Update("role", req.Role).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
        return
    }
    
    user.Role = req.Role
    c.JSON(http.StatusOK, gin.H{"user": user})
}
