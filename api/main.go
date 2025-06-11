package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    
    "library-management/container"
    "library-management/database"
    "library-management/middleware"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }
    
    // Connect to database
    database.Connect()
    
    // Run migrations
    database.Migrate()
    
    // Seed data
    database.SeedData()
    
    // Initialize dependency injection container
    c := container.NewContainer(database.DB)
    
    // Set Gin mode
    if os.Getenv("GIN_MODE") == "release" {
        gin.SetMode(gin.ReleaseMode)
    }
    
    // Setup Gin router
    r := gin.New()
    
    // Middleware
    r.Use(middleware.LoggingMiddleware())
    r.Use(middleware.CORSMiddleware())
    r.Use(gin.Recovery())
    
    // Public routes
    auth := r.Group("/api/auth")
    {
        auth.POST("/login", c.AuthHandler.Login)
        auth.POST("/register", c.AuthHandler.Register)
    }
    
    // Protected routes
    api := r.Group("/api")
    api.Use(middleware.AuthMiddleware())
    {
        // Auth routes
        authRoutes := api.Group("/auth")
        {
            authRoutes.GET("/me", c.AuthHandler.GetMe)
            authRoutes.POST("/logout", c.AuthHandler.Logout)
            authRoutes.PUT("/change-password", c.AuthHandler.ChangePassword)
        }
        
        // Book routes
        books := api.Group("/books")
        {
            books.GET("", c.BookHandler.GetBooks)
            books.GET("/:id", c.BookHandler.GetBook)
            books.POST("", c.BookHandler.CreateBook)
            books.PUT("/:id", c.BookHandler.UpdateBook)
            books.DELETE("/:id", c.BookHandler.DeleteBook)
            books.PUT("/:id/status", c.BookHandler.UpdateBookStatus)
        }
        
        // Checkout routes
        checkouts := api.Group("/checkouts")
        {
            checkouts.GET("", c.CheckoutHandler.GetCheckouts)
            checkouts.POST("", c.CheckoutHandler.CreateCheckout)
            checkouts.PUT("/:id/return", c.CheckoutHandler.ReturnBook)
            checkouts.GET("/overdue", c.CheckoutHandler.GetOverdueCheckouts)
            checkouts.GET("/user/:user_id", c.CheckoutHandler.GetUserCheckouts)
        }
        
        // Stats routes
        stats := api.Group("/stats")
        {
            stats.GET("/overview", c.StatsHandler.GetStatsOverview)
            stats.GET("/monthly", c.StatsHandler.GetMonthlyStats)
            stats.GET("/popular", c.StatsHandler.GetPopularBooks)
            stats.GET("/user/:user_id", c.StatsHandler.GetUserStats)
        }
        
        // User management routes (admin only)
        users := api.Group("/users")
        users.Use(middleware.AdminMiddleware())
        {
            users.GET("", c.UserHandler.GetUsers)
            users.GET("/:id", c.UserHandler.GetUser)
            users.POST("", c.UserHandler.CreateUser)
            users.PUT("/:id", c.UserHandler.UpdateUser)
            users.DELETE("/:id", c.UserHandler.DeleteUser)
            users.PUT("/:id/role", c.UserHandler.UpdateUserRole)
        }
    }
    
    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status":    "ok",
            "timestamp": time.Now().UTC(),
            "version":   "1.0.0",
        })
    })
    
    // Server configuration
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    srv := &http.Server{
        Addr:    ":" + port,
        Handler: r,
    }
    
    // Start server in a goroutine
    go func() {
        log.Printf("Server starting on port %s", port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()
    
    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down server...")
    
    // 5 second timeout for shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    // Close database connection
    database.Close()
    
    log.Println("Server exited")
}
