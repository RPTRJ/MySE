package main

import (
	"log"
	"os"
	"time"

	"github.com/RPTRJ/MySE/backend/config"
	"github.com/RPTRJ/MySE/backend/controller"
	"github.com/RPTRJ/MySE/backend/middlewares"
	"github.com/RPTRJ/MySE/backend/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	db := config.GetDB()
	authService := services.NewAuthService(db)

	authController := controller.NewAuthController(authService)
	authController.RegisterRoutes(r)

	userController := controller.NewUserController()
	protected := r.Group("")
	protected.Use(middlewares.Authorization())
	userController.RegisterRoutes(protected)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	return r
}
