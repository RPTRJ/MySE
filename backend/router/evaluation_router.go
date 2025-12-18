package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"gorm.io/gorm"
)

func RegisterEvaluationRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.EvaluationController{DB: db}
	group := r.Group("/api/evaluations")
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
	}
}