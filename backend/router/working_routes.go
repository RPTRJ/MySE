package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func WorkingRoutes(r gin.IRoutes) {
	wc := controller.NewWorkingController()
	uc := controller.NewUploadController()

	r.POST("/upload", uc.UploadFile) // Public upload or protected? Let's make it public for simplicity unless user wants protected. Protected is safer. But main.go passes 'protected' group to WorkingRoutes, so it effectively inherits it! 
    // Wait, main.go: router.WorkingRoutes(protected). Yes.
    // So if I add it here, it will be protected.
	
	r.POST("/workings", wc.CreateWorking)
	r.GET("/workings", wc.ListWorkings)
	r.GET("/workings/:id", wc.GetWorking)
	r.PATCH("/workings/:id", wc.UpdateWorking)
	r.DELETE("/workings/:id", wc.DeleteWorking)
	
	r.GET("/type_workings", wc.ListTypeWorkings)
}
