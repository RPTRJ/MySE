package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

func (u *UploadController) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Create uploads directory if not exists
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get the request origin or use environment variable
	host := os.Getenv("API_URL")
	if host == "" {
		// Use the request's host
		scheme := "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
		host = fmt.Sprintf("%s://%s", scheme, c.Request.Host)
	}

	// Remove trailing slash from host if exists
	if len(host) > 0 && host[len(host)-1] == '/' {
		host = host[:len(host)-1]
	}

	// Return full URL
	fileURL := fmt.Sprintf("%s/uploads/%s", host, fileName)
	c.JSON(http.StatusOK, gin.H{"url": fileURL})
}
