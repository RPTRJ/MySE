package router

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine{
	r := gin.Default()

	// เรียกใช้ฟังก์ชัน routes ต่างๆ ที่นี่
	TemplateBlockRoutes(r)

	return r
}
	