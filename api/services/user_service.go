package services

import (
    "errors"
    "golang.org/x/crypto/bcrypt"
    "library-management/models"
    "library-management/repositories"
)

type UserService struct {
    userRepo     repositories.UserRepository
    checkoutRepo repositories.CheckoutRepository
}

func NewUserService(userRepo repositories.UserRepository, checkoutRepo repositories.CheckoutRepository) *UserService {
    return &UserService{
        userRepo:     userRepo,
        checkoutRepo: checkoutRepo,
    }
}

func (s *UserService) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
    // Check if email already exists
    if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
        return nil, errors.New("email already exists")
    }
    
    // Check if student ID already exists (if provided)
    if req.StudentID != nil && *req.StudentID != "" {
        if _, err := s.userRepo.GetByStudentID(*req.StudentID); err == nil {
            return nil, errors.New("student ID already exists")
        }
    }
    
    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, errors.New("failed to hash password")
    }
    
    user := &models.User{
        Name:      req.Name,
        Email:     req.Email,
        Password:  string(hashedPassword),
        StudentID: req.StudentID,
        Role:      req.Role,
    }
    
    if user.Role == "" {
        user.Role = models.UserRoleUser
    }
    
    if err := s.userRepo.Create(user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
    return s.userRepo.GetByID(id)
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
    return s.userRepo.GetByEmail(email)
}

func (s *UserService) UpdateUser(id uint, req *models.CreateUserRequest) (*models.User, error) {
    user, err := s.userRepo.GetByID(id)
    if err != nil {
        return nil, err
    }
    
    // Check email uniqueness (if changed)
    if req.Email != user.Email {
        if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
            return nil, errors.New("email already exists")
        }
    }
    
    // Check student ID uniqueness (if changed)
    if req.StudentID != nil && *req.StudentID != "" {
        currentStudentID := ""
        if user.StudentID != nil {
            currentStudentID = *user.StudentID
        }
        
        if *req.StudentID != currentStudentID {
            if _, err := s.userRepo.GetByStudentID(*req.StudentID); err == nil {
                return nil, errors.New("student ID already exists")
            }
        }
    }
    
    // Update user fields
    user.Name = req.Name
    user.Email = req.Email
    user.StudentID = req.StudentID
    
    if req.Role != "" {
        user.Role = req.Role
    }
    
    // Update password if provided
    if req.Password != "" {
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
        if err != nil {
            return nil, errors.New("failed to hash password")
        }
        user.Password = string(hashedPassword)
    }
    
    if err := s.userRepo.Update(user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *UserService) DeleteUser(id uint) error {
    // Check if user has active checkouts
    activeCheckouts, err := s.checkoutRepo.GetActiveByUserID(id)
    if err != nil {
        return err
    }
    
    if activeCheckouts > 0 {
        return errors.New("cannot delete user with active checkouts")
    }
    
    return s.userRepo.Delete(id)
}

func (s *UserService) ListUsers(filter repositories.UserFilter) ([]models.User, int64, error) {
    return s.userRepo.List(filter)
}

func (s *UserService) UpdateUserRole(id uint, role string) (*models.User, error) {
    user, err := s.userRepo.GetByID(id)
    if err != nil {
        return nil, err
    }
    
    if err := s.userRepo.UpdateRole(id, role); err != nil {
        return nil, err
    }
    
    user.Role = role
    return user, nil
}

func (s *UserService) ChangePassword(id uint, currentPassword, newPassword string) error {
    user, err := s.userRepo.GetByID(id)
    if err != nil {
        return err
    }
    
    // Verify current password
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
        return errors.New("current password is incorrect")
    }
    
    // Hash new password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
    if err != nil {
        return errors.New("failed to hash password")
    }
    
    return s.userRepo.UpdatePassword(id, string(hashedPassword))
}

func (s *UserService) ValidateCredentials(email, password string) (*models.User, error) {
    user, err := s.userRepo.GetByEmail(email)
    if err != nil {
        return nil, errors.New("invalid credentials")
    }
    
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
        return nil, errors.New("invalid credentials")
    }
    
    return user, nil
}
