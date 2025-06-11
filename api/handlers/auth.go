package handlers

import (
    "net/http"
    "strings"
    
    "github.com/gin-gonic/gin"
    "library-management/utils"
)

func Login(c *gin.Context) {
    var req struct {
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Use Supabase Auth API for login
    user, err := utils.SupabaseClient.Auth.SignIn(c, req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "token": user.AccessToken,
        "user": gin.H{
            "id":    user.User.ID,
            "email": user.User.Email,
            "name":  user.User.UserMetadata["name"],
            "role":  user.User.AppMetadata["role"],
        },
    })
}

func GetMe(c *gin.Context) {
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
        return
    }
    
    // Get user from Supabase Auth
    user, err := utils.SupabaseClient.Auth.User(c, userID.(string))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
            "name":  user.UserMetadata["name"],
            "role":  user.AppMetadata["role"],
        },
    })
}

func Logout(c *gin.Context) {
    authHeader := c.GetHeader("Authorization")
    if authHeader != "" {
        token := strings.Replace(authHeader, "Bearer ", "", 1)
        err := utils.SupabaseClient.Auth.SignOut(c, token)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
            return
        }
    }
    
    c.JSON(http.StatusOK, gin.H{"success": true})
}
