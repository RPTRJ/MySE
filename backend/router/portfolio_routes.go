package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func PortfolioRoutes(r *gin.Engine) {
	group := r.Group("/portfolio")
	{
		// Portfolio
		group.POST("", controller.CreatePortfolio)
		group.PATCH("/:id", controller.UpdatePortfolio) // ✅ NEW: Update Portfolio (Cover)
		group.GET("/my", controller.GetMyPortfolio)
		
		// Template
		group.POST("/template", controller.CreateTemplate)
		group.POST("/use-template/:id", controller.UseTemplate)
		
		// Section
		group.POST("/section", controller.CreatePortfolioSection)
		group.PATCH("/section/:id", controller.UpdatePortfolioSection)
		group.DELETE("/section/:id", controller.DeletePortfolioSection) // ✅ NEW: Delete Section
		
		// ✅ Block CRUD
		group.POST("/block", controller.CreatePortfolioBlock)
		group.PATCH("/block/:id", controller.UpdatePortfolioBlock) // ✅ NEW
		group.DELETE("/block/:id", controller.DeletePortfolioBlock) // ✅ NEW
		
		// Data Sources
		group.GET("/activities", controller.GetActivities)
		group.GET("/workings", controller.GetWorkings)
	}
}