package utils

import (
    "errors"
    "fmt"
    "os"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "library-management/models"
)

var jwtSecret []byte

func init() {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        secret = "your-secret-key-change-this-in-production"
    }
    jwtSecret = []byte(secret)
}

type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// GenerateToken generates a JWT token for the given user
func GenerateToken(user *models.User) (string, error) {
    expirationTime := time.Now().Add(24 * time.Hour)
    
    claims := &Claims{
        UserID: user.ID,
        Email:  user.Email,
        Role:   user.Role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "library-management",
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return jwtSecret, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}

// RefreshToken generates a new token for the given user (if the current token is valid)
func RefreshToken(tokenString string) (string, error) {
    claims, err := ValidateToken(tokenString)
    if err != nil {
        return "", err
    }
    
    // トークンの有効期限が1時間以内の場合のみリフレッシュを許可
    if time.Until(claims.ExpiresAt.Time) > time.Hour {
        return "", errors.New("token is still valid for more than 1 hour")
    }
    
    // 新しいトークンを生成
    user := &models.User{
        ID:    claims.UserID,
        Email: claims.Email,
        Role:  claims.Role,
    }
    
    return GenerateToken(user)
}
