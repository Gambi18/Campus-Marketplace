package config

import (
	
	"log"
	"os"
	"fmt"

	"github.com/joho/godotenv"
)

type Config struct {
	Port     string
	Env      string
	LogLevel string
	DBHost   string
	DBPort   string
	DBUser   string
	DBPass   string
	DBName   string
	JWTSecret string
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string
	AdminUsername       string
	AdminEmail          string
	AdminPassword       string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println(" No .env file found")
	}
	return &Config{
		Port:     getEnv("PORT", "8080"),
		Env:      getEnv("ENV", "development"),
		LogLevel: getEnv("LOG_LEVEL", "info"),
		DBHost:   getEnv("DB_HOST", "localhost"),
		DBPort:   getEnv("DB_PORT", "5432"),
		DBUser:   getEnv("DB_USER", "Admin"),
		DBPass:   getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "campus_marketplace"),
		JWTSecret: getEnv("JWT_SECRET", ""),
		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),
		AdminUsername:       getEnv("ADMIN_USERNAME", "admin"),
		AdminEmail:          getEnv("ADMIN_EMAIL", ""),
		AdminPassword:       getEnv("ADMIN_PASSWORD", ""),
	}
}
// added this cause Always built fresh from current field values
func (c *Config) DatabaseURL() string {
    return fmt.Sprintf(
        "postgres://%s:%s@%s:%s/%s?sslmode=disable",
        c.DBUser,
        c.DBPass,
        c.DBHost,
        c.DBPort,
        c.DBName,
    )
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
