package controller

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/services"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

// Max file size: 5MB
const MaxFileSize = 5 * 1024 * 1024

// Allowed image extensions
var AllowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".bmp":  true,
}

// Allowed MIME types
var AllowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
	"image/bmp":  true,
}

func (u *UploadController) UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	defer file.Close()

	// Check file size (5MB limit)
	if header.Size > MaxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must not exceed 5MB"})
		return
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !AllowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files are allowed (JPG, PNG, GIF, WEBP, BMP)"})
		return
	}

	// Check MIME type
	contentType := header.Header.Get("Content-Type")
	if !AllowedMimeTypes[contentType] {
		// Try to detect from extension
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		case ".bmp":
			contentType = "image/bmp"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type"})
			return
		}
	}

	// Upload to Azure Blob Storage
	if services.AzureStorage == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Storage service not initialized"})
		return
	}

	url, err := services.AzureStorage.UploadFile(file, header.Filename, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}
