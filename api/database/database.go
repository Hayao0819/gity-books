package database

import (
    "fmt"
    "log"
    "os"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
    
    "library-management/models"
)

var DB *gorm.DB

// Connect initializes the database connection using GORM
func Connect() {
    var err error
    
    // データベース接続文字列を構築
    dsn := buildDSN()
    
    // GORM設定
    config := &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    }
    
    // データベースに接続
    DB, err = gorm.Open(postgres.Open(dsn), config)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    
    // 接続プールの設定
    sqlDB, err := DB.DB()
    if err != nil {
        log.Fatalf("Failed to get database instance: %v", err)
    }
    
    // 接続プールの設定
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)
    
    log.Println("Connected to PostgreSQL database successfully")
}

// buildDSN builds the database connection string
func buildDSN() string {
    host := getEnvOrDefault("DB_HOST", "localhost")
    port := getEnvOrDefault("DB_PORT", "5432")
    user := getEnvOrDefault("DB_USER", "postgres")
    password := getEnvOrDefault("DB_PASSWORD", "password")
    dbname := getEnvOrDefault("DB_NAME", "library_management")
    sslmode := getEnvOrDefault("DB_SSLMODE", "disable")
    timezone := getEnvOrDefault("DB_TIMEZONE", "UTC")
    
    return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
        host, port, user, password, dbname, sslmode, timezone)
}

// getEnvOrDefault gets environment variable or returns default value
func getEnvOrDefault(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

// Migrate runs database migrations
func Migrate() {
    log.Println("Running database migrations...")
    
    err := DB.AutoMigrate(
        &models.User{},
        &models.Book{},
        &models.Checkout{},
    )
    
    if err != nil {
        log.Fatalf("Failed to run migrations: %v", err)
    }
    
    log.Println("Database migrations completed successfully")
}

// SeedData inserts initial data into the database
func SeedData() {
    log.Println("Seeding database with initial data...")
    
    // 管理者ユーザーの作成
    var adminCount int64
    DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
    
    if adminCount == 0 {
        admin := models.User{
            Name:     "Administrator",
            Email:    "admin@library.com",
            Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
            Role:     "admin",
        }
        
        if err := DB.Create(&admin).Error; err != nil {
            log.Printf("Failed to create admin user: %v", err)
        } else {
            log.Println("Admin user created successfully")
        }
    }
    
    // サンプル本の作成
    var bookCount int64
    DB.Model(&models.Book{}).Count(&bookCount)
    
    if bookCount == 0 {
        sampleBooks := []models.Book{
            {
                Title:         "Go言語プログラミング",
                Author:        "山田太郎",
                ISBN:          "978-4-123456-78-9",
                Publisher:     "技術出版社",
                PublishedYear: 2023,
                Description:   "Go言語の基礎から応用まで学べる入門書",
                Status:        "available",
            },
            {
                Title:         "データベース設計入門",
                Author:        "佐藤花子",
                ISBN:          "978-4-987654-32-1",
                Publisher:     "データベース出版",
                PublishedYear: 2022,
                Description:   "効率的なデータベース設計の手法を解説",
                Status:        "available",
            },
            {
                Title:         "Web開発実践ガイド",
                Author:        "田中一郎",
                ISBN:          "978-4-555666-77-8",
                Publisher:     "Web技術社",
                PublishedYear: 2024,
                Description:   "モダンなWeb開発技術の実践的な解説書",
                Status:        "available",
            },
        }
        
        for _, book := range sampleBooks {
            if err := DB.Create(&book).Error; err != nil {
                log.Printf("Failed to create sample book: %v", err)
            }
        }
        
        log.Printf("Created %d sample books", len(sampleBooks))
    }
    
    log.Println("Database seeding completed")
}

// Close closes the database connection
func Close() {
    if DB != nil {
        sqlDB, err := DB.DB()
        if err != nil {
            log.Printf("Failed to get database instance: %v", err)
            return
        }
        
        if err := sqlDB.Close(); err != nil {
            log.Printf("Failed to close database connection: %v", err)
        } else {
            log.Println("Database connection closed successfully")
        }
    }
}
