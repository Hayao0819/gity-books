package container

import (
    "gorm.io/gorm"
    "library-management/handlers"
    "library-management/repositories"
    "library-management/services"
)

type Container struct {
    // Repositories
    UserRepository     repositories.UserRepository
    BookRepository     repositories.BookRepository
    CheckoutRepository repositories.CheckoutRepository
    
    // Services
    UserService     *services.UserService
    BookService     *services.BookService
    CheckoutService *services.CheckoutService
    
    // Handlers
    AuthHandler     *handlers.AuthHandler
    UserHandler     *handlers.UserHandler
    BookHandler     *handlers.BookHandler
    CheckoutHandler *handlers.CheckoutHandler
    StatsHandler    *handlers.StatsHandler
}

func NewContainer(db *gorm.DB) *Container {
    // Initialize repositories
    userRepo := repositories.NewUserRepository(db)
    bookRepo := repositories.NewBookRepository(db)
    checkoutRepo := repositories.NewCheckoutRepository(db)
    
    // Initialize services
    userService := services.NewUserService(userRepo, checkoutRepo)
    bookService := services.NewBookService(bookRepo, checkoutRepo)
    checkoutService := services.NewCheckoutService(checkoutRepo, bookRepo, userRepo, db)
    
    // Initialize handlers
    authHandler := handlers.NewAuthHandler(userService)
    userHandler := handlers.NewUserHandler(userService)
    bookHandler := handlers.NewBookHandler(bookService)
    checkoutHandler := handlers.NewCheckoutHandler(checkoutService)
    statsHandler := handlers.NewStatsHandler(checkoutService)
    
    return &Container{
        UserRepository:     userRepo,
        BookRepository:     bookRepo,
        CheckoutRepository: checkoutRepo,
        UserService:        userService,
        BookService:        bookService,
        CheckoutService:    checkoutService,
        AuthHandler:        authHandler,
        UserHandler:        userHandler,
        BookHandler:        bookHandler,
        CheckoutHandler:    checkoutHandler,
        StatsHandler:       statsHandler,
    }
}
