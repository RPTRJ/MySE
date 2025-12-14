package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"github.com/sut68/team14/backend/router"
	"github.com/sut68/team14/backend/services"
)

func main() {
	loadEnv()

	config.ConnectionDatabase()

	router := setupRouter()
	port := resolvePort()

	log.Printf("Server is running on http://localhost:%s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}

func loadEnv() {
	if os.Getenv("GIN_MODE") == "release" {
		return
	}

	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

func resolvePort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "8080"
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept", "User-Agent", "Cache-Control", "Pragma"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	corsConfig.AllowCredentials = true
	corsConfig.MaxAge = 12 * time.Hour

	r.Use(cors.New(corsConfig))

	// Serve static files
	r.Static("/uploads", "./uploads")

	db := config.GetDB()
	authService := services.NewAuthService(db)

	authController := controller.NewAuthController(authService)
	authController.RegisterRoutes(r)

	userController := controller.NewUserController()
	protected := r.Group("")
	protected.Use(middlewares.Authorization())
	userController.RegisterSelfRoutes(protected)

	protectedOnboarded := protected.Group("")
	protectedOnboarded.Use(middlewares.RequireOnboarding())
	userController.RegisterRoutes(protectedOnboarded)

	curriculumController := controller.NewCurriculumController()
	curriculumController.RegisterRoutes(r, protectedOnboarded)

	facultyController := controller.NewFacultyController()
	facultyController.RegisterRoutes(r, protected)

	programController := controller.NewProgramController()
	programController.RegisterRoutes(r, protected)

	profileController := controller.NewStudentProfileController()
	profileController.RegisterRoutes(protectedOnboarded)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	router.TemplateBlockRoutes(r)
	router.WorkingRoutes(protected)
	router.ActivityRoutes(protected)

	return r
}
