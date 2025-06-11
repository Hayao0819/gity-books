package services

import (
    "errors"
    "library-management/models"
    "library-management/repositories"
)

type BookService struct {
    bookRepo     repositories.BookRepository
    checkoutRepo repositories.CheckoutRepository
}

func NewBookService(bookRepo repositories.BookRepository, checkoutRepo repositories.CheckoutRepository) *BookService {
    return &BookService{
        bookRepo:     bookRepo,
        checkoutRepo: checkoutRepo,
    }
}

func (s *BookService) CreateBook(req *models.CreateBookRequest) (*models.Book, error) {
    // Check ISBN uniqueness (if provided)
    if req.ISBN != "" {
        if _, err := s.bookRepo.GetByISBN(req.ISBN); err == nil {
            return nil, errors.New("book with this ISBN already exists")
        }
    }
    
    book := &models.Book{
        Title:         req.Title,
        Author:        req.Author,
        ISBN:          req.ISBN,
        Publisher:     req.Publisher,
        PublishedYear: req.PublishedYear,
        Description:   req.Description,
        Status:        models.BookStatusAvailable,
    }
    
    if err := s.bookRepo.Create(book); err != nil {
        return nil, err
    }
    
    return book, nil
}

func (s *BookService) GetBookByID(id uint) (*models.Book, error) {
    return s.bookRepo.GetByID(id)
}

func (s *BookService) UpdateBook(id uint, req *models.UpdateBookRequest) (*models.Book, error) {
    book, err := s.bookRepo.GetByID(id)
    if err != nil {
        return nil, err
    }
    
    // Check ISBN uniqueness (if changed)
    if req.ISBN != "" && req.ISBN != book.ISBN {
        if _, err := s.bookRepo.GetByISBN(req.ISBN); err == nil {
            return nil, errors.New("book with this ISBN already exists")
        }
    }
    
    // Update book fields
    book.Title = req.Title
    book.Author = req.Author
    book.ISBN = req.ISBN
    book.Publisher = req.Publisher
    book.PublishedYear = req.PublishedYear
    book.Description = req.Description
    
    if err := s.bookRepo.Update(book); err != nil {
        return nil, err
    }
    
    return book, nil
}

func (s *BookService) DeleteBook(id uint) error {
    book, err := s.bookRepo.GetByID(id)
    if err != nil {
        return err
    }
    
    // Check if book is borrowed
    if book.Status == models.BookStatusBorrowed {
        return errors.New("cannot delete borrowed book")
    }
    
    // Check for active checkouts
    activeCheckouts, err := s.checkoutRepo.GetActiveByBookID(id)
    if err != nil {
        return err
    }
    
    if activeCheckouts > 0 {
        return errors.New("cannot delete book with active checkouts")
    }
    
    return s.bookRepo.Delete(id)
}

func (s *BookService) ListBooks(filter repositories.BookFilter) ([]models.Book, int64, error) {
    return s.bookRepo.List(filter)
}

func (s *BookService) UpdateBookStatus(id uint, status string) (*models.Book, error) {
    book, err := s.bookRepo.GetByID(id)
    if err != nil {
        return nil, err
    }
    
    if err := s.bookRepo.UpdateStatus(id, status); err != nil {
        return nil, err
    }
    
    book.Status = status
    return book, nil
}
