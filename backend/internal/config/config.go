package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 string
	Env                  string
	LogLevel             string
	DBHost               string
	DBPort               string
	DBUser               string
	DBPass               string
	DBName               string
	DBSSLMode            string
	JWTSecret            string
	RefreshSecret        string
	CloudinaryCloudName  string
	CloudinaryAPIKey     string
	CloudinaryAPISecret  string
	AdminUsername        string
	AdminEmail           string
	AdminPassword        string
	AdminBootstrapToken  string
	CamPayBaseURL        string
	CamPayAppUsername    string
	CamPayAppPassword    string
	CamPayPermanentToken string
	PlatformFeeOnSale    float64
	PlatformFeeOnRefund  float64
	AllowedOrigins       []string
	CookieDomain         string
	CookieSecure         bool
	// TrustedProxies is an optional list of proxy IPs/CIDRs gin should trust for
	// X-Forwarded-For resolution. Empty means "trust none" (ClientIP falls back to
	// the raw RemoteAddr), which prevents X-Forwarded-For spoofing from defeating
	// the rate limiter and audit-IP logging.
	TrustedProxies []string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println(" No .env file found")
	}
	return &Config{
		Port:                 getEnv("PORT", "8080"),
		Env:                  getEnv("ENV", "development"),
		LogLevel:             getEnv("LOG_LEVEL", "info"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5432"),
		DBUser:               getEnv("DB_USER", "Admin"),
		DBPass:               getEnv("DB_PASSWORD", "password"),
		DBName:               getEnv("DB_NAME", "campus_marketplace"),
		DBSSLMode:            getEnv("DB_SSLMODE", "disable"),
		JWTSecret:            getEnv("JWT_SECRET", ""),
		RefreshSecret:        getEnv("REFRESH_TOKEN_SECRET", ""),
		CloudinaryCloudName:  getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:     getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret:  getEnv("CLOUDINARY_API_SECRET", ""),
		AdminUsername:        getEnv("ADMIN_USERNAME", "admin"),
		AdminEmail:           getEnv("ADMIN_EMAIL", ""),
		AdminPassword:        getEnv("ADMIN_PASSWORD", ""),
		AdminBootstrapToken:  getEnv("ADMIN_BOOTSTRAP_TOKEN", ""),
		CamPayBaseURL:        getEnv("CAMPAY_BASE_URL", "https://demo.campay.net/api"),
		CamPayAppUsername:    getEnv("CAMPAY_APP_USERNAME", ""),
		CamPayAppPassword:    getEnv("CAMPAY_APP_PASSWORD", ""),
		CamPayPermanentToken: getEnv("CAMPAY_PERMANENT_TOKEN", ""),
		PlatformFeeOnSale:    0.03,
		PlatformFeeOnRefund:  0.01,
		AllowedOrigins:       parseOrigins(getEnv("ALLOWED_ORIGINS", "http://localhost:3000")),
		CookieDomain:         getEnv("COOKIE_DOMAIN", ""),
		CookieSecure:         getEnv("ENV", "development") == "production",
		TrustedProxies:       parseOrigins(getEnv("TRUSTED_PROXIES", "")),
	}
}

// parseOrigins splits a comma-separated ALLOWED_ORIGINS env value into a
// trimmed, non-empty slice used for both CORS and WebSocket origin checks.
func parseOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

// added this cause Always built fresh from current field values
func (c *Config) DatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.DBUser,
		c.DBPass,
		c.DBHost,
		c.DBPort,
		c.DBName,
		c.DBSSLMode,
	)
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
