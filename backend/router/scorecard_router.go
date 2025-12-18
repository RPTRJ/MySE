package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"gorm.io/gorm"
)

func RegisterScorecardRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.ScorecardController{DB: db}
	group := r.Group("/api/scorecards")
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
	}
}