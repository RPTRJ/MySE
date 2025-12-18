package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func ColorsRoutes(r *gin.Engine) {
	// colorsGroup := r.Group("/colors")
	// {
	// 	colorsGroup.GET("/", controller.GetAllColors)
	// }
	r.GET("/colors", controller.GetAllColors)
}