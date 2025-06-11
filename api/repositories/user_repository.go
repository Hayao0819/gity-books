package repositories

import (
    "errors"
    "gorm.io/gorm"
    "library-management/models"
)

type userRepository struct {
    db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
    if err := r.db.Create(user).Error; err != nil {
        return err
    }
    return nil
}

func (r *userRepository) GetByID(id uint) (*models.User, error) {
    var user models.User
    if err := r.db.Preload("Checkouts.Book").Where("id = ?", id).First(&user).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) GetByEmail(email string) (*models.User, error) {
    var user models.User
    if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) GetByStudentID(studentID string) (*models.User, error) {
    var user models.User
    if err := r.db.Where("student_id = ?", studentID).First(&user).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) Update(user *models.User) error {
    return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
    return r.db.Delete(&models.User{}, id).Error
}

func (r *userRepository) List(filter UserFilter) ([]models.User, int64, error) {
    var users []models.User
    var total int64
    
    query := r.db.Model(&models.User{})
    
    // Apply search filter
    if filter.Search != "" {
        searchPattern := "%" + filter.Search + "%"
        query = query.Where("name ILIKE ? OR email ILIKE ? OR student_id ILIKE ?", 
            searchPattern, searchPattern, searchPattern)
    }
    
    // Apply role filter
    if filter.Role != "" {
        query = query.Where("role = ?", filter.Role)
    }
    
    // Get total count
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    // Apply pagination
    offset := (filter.Page - 1) * filter.Limit
    if err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&users).Error; err != nil {
        return nil, 0, err
    }
    
    return users, total, nil
}

func (r *userRepository) UpdateRole(id uint, role string) error {
    return r.db.Model(&models.User{}).Where("id = ?", id).Update("role", role).Error
}

func (r *userRepository) UpdatePassword(id uint, hashedPassword string) error {
    return r.db.Model(&models.User{}).Where("id = ?", id).Update("password", hashedPassword).Error
}
