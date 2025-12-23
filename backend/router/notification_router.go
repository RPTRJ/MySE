package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func NotificationRouter(r *gin.Engine) {
	r.POST("/notifications", controller.CreateNotification)
	r.GET("/notifications", controller.GetNotifications)
	r.GET("/notifications/:id", controller.GetNotificationByID)
	r.PUT("/notifications/:id", controller.UpdateNotification)
	r.DELETE("/notifications/:id", controller.DeleteNotification)
}