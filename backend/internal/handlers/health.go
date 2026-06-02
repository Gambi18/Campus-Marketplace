package handlers


import (
	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check endpoint
func HealthHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"status": "ok",
	})
}

// StatusHandler handles status endpoint
func StatusHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Campus Marketplace API v1",
	})
}
