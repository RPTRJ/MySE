package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"gorm.io/gorm"
)

func RegisterFeedbackRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.FeedbackController{DB: db}
	group := r.Group("/api/feedbacks")
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
	}
}