package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

type WorkingController struct{}

func NewWorkingController() *WorkingController {
	return &WorkingController{}
}

// CreateWorking
func (wc *WorkingController) CreateWorking(c *gin.Context) {
	var working entity.Working

	// Bind JSON to working struct
	if err := c.ShouldBindJSON(&working); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Safely assert type
	if v, ok := userID.(uint); ok {
		working.UserID = v
	} else if v, ok := userID.(float64); ok {
		working.UserID = uint(v)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}
	
	// Create the working (and associated detail if struct is set up right)
	if err := db.Create(&working).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": working})
}

// GetWorking
func (wc *WorkingController) GetWorking(c *gin.Context) {
	id := c.Param("id")
	var working entity.Working

	db := config.GetDB()
	if err := db.Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking").
		Preload("WorkingDetail.Images").
		Preload("WorkingDetail.Links").
		Preload("User").
		First(&working, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Working not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": working})
}

// ListWorkings
func (wc *WorkingController) ListWorkings(c *gin.Context) {
	var workings []entity.Working

	db := config.GetDB()
	// Preload necessary associations
	if err := db.Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking").
		Preload("WorkingDetail.Images").
		Preload("WorkingDetail.Links").
		Preload("User").
		Find(&workings).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": workings})
}

// UpdateWorking
func (wc *WorkingController) UpdateWorking(c *gin.Context) {
	id := c.Param("id")
	var working entity.Working

	db := config.GetDB()
	if err := db.First(&working, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Working not found"})
		return
	}

	if err := c.ShouldBindJSON(&working); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Save(&working).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": working})
}

// DeleteWorking
func (wc *WorkingController) DeleteWorking(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	
	if err := db.Delete(&entity.Working{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "id deleted"})
}

// ListTypeWorkings
func (wc *WorkingController) ListTypeWorkings(c *gin.Context) {
	var types []entity.TypeWorking

	db := config.GetDB()
	if err := db.Find(&types).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}
