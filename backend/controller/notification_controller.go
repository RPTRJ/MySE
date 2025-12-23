package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/config"
)

func CreateNotification(c *gin.Context) {
	var notif entity.Notification
	if err := c.ShouldBindJSON(&notif); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.GetDB()
	if err := db.Create(&notif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
		return
	}
	c.JSON(http.StatusOK, notif)
}

func GetNotifications(c *gin.Context) {
	db := config.GetDB()
	var notifs []entity.Notification
	if err := db.Preload("User").Preload("Announcement").Find(&notifs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}
	c.JSON(http.StatusOK, notifs)
}

func GetNotificationByID(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var notif entity.Notification
	if err := db.Preload("User").Preload("Announcement").First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, notif)
}

func UpdateNotification(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var notif entity.Notification
	if err := db.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	if err := c.ShouldBindJSON(&notif); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&notif)
	c.JSON(http.StatusOK, notif)
}

func DeleteNotification(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	if err := db.Delete(&entity.Notification{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}