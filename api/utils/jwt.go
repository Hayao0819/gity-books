package utils

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
	
	"github.com/golang-jwt/jwt/v5"
	"library-management/models"
)

// SupabaseのJWT検証用の公開鍵
var supabaseJWTSecret []byte

func init() {
	// Supabase JWT Secret (JWT検証用の公開鍵)
	// 実際の環境では、Supabaseのプロジェクト設定から取得したJWT秘密鍵を使用
	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		secret = "your-supabase-jwt-secret-key"
	}
	supabaseJWTSecret = []byte(secret)
}

type SupabaseClaims struct {
	Sub       string                 `json:"sub"`
	Email     string                 `json:"email"`
	Role      string                 `json:"role"`
	AppMetadata map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	jwt.RegisteredClaims
}

// ValidateSupabaseToken validates a JWT token from Supabase
func ValidateSupabaseToken(tokenString string) (*SupabaseClaims, error) {
	// Bearer トークンの場合、"Bearer "を削除
	tokenString = strings.Replace(tokenString, "Bearer ", "", 1)
	
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Supabaseは通常HS256アルゴリズムを使用
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return supabaseJWTSecret, nil
	})
	
	if err != nil {
		return nil, err
	}
	
	if claims, ok := token.Claims.(*SupabaseClaims); ok && token.Valid {
		return claims, nil
	}
	
	return nil, errors.New("invalid token")
}

// GenerateToken は従来のJWT生成関数（Supabase認証を使用する場合は不要になる可能性あり）
func GenerateToken(user *models.User) (string, error) {
	claims := &SupabaseClaims{
		Sub:    user.ID,
		Email:  user.Email,
		Role:   user.Role,
		AppMetadata: map[string]interface{}{
			"role": user.Role,
		},
		UserMetadata: map[string]interface{}{
			"name": user.Name,
		},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(supabaseJWTSecret)
}
