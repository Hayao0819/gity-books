package main

import (
    "log"
    "os"
    
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    
    "library-management/database"
    "library-management/handlers"
    "library-management/middleware"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }
    
    // Connect to Supabase
    database.Connect()
    
    // Setup Gin router
    r := gin.Default()
    
    // Middleware
    r.Use(middleware.CORSMiddleware())
    
    // Public routes
    auth := r.Group("/api/auth")
    {
        auth.POST("/login", handlers.Login)
    }
    
    // Protected routes
    api := r.Group("/api")
    api.Use(middleware.AuthMiddleware())
    {
        // Auth routes
        auth := api.Group("/auth")
        {
            auth.GET("/me", handlers.GetMe)
            auth.POST("/logout", handlers.Logout)
        }
        
        // Books routes
        books := api.Group("/books")
        {
            books.GET("", handlers.GetBooks)
            books.GET("/:id", handlers.GetBook)
            books.POST("", handlers.CreateBook)
            books.PUT("/:id", handlers.UpdateBook)
            books.DELETE("/:id", handlers.DeleteBook)
        }
        
        // Checkouts routes
        checkouts := api.Group("/checkouts")
        {
            checkouts.GET("", handlers.GetCheckouts)
            checkouts.POST("", handlers.CreateCheckout)
            checkouts.PUT("/:id/return", handlers.ReturnBook)
            checkouts.GET("/overdue", handlers.GetOverdueCheckouts)
        }
        
        // Stats routes
        stats := api.Group("/stats")
        {
            stats.GET("/overview", handlers.GetStatsOverview)
            stats.GET("/monthly", handlers.GetMonthlyStats)
            stats.GET("/popular", handlers.GetPopularBooks)
        }
    }
    
    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })
    
    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("Server starting on port %s", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
