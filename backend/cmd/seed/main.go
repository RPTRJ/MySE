package main

import (
	"log"
	"os"

	"github.com/RPTRJ/MySE/backend/config"
	"github.com/RPTRJ/MySE/backend/seed"
	"github.com/joho/godotenv"
)

func main() {
	loadEnv()
	config.ConnectionDatabase()

	seed.SeedUsers()
	log.Println("Seed completed successfully")
}

func loadEnv() {
	if os.Getenv("GIN_MODE") == "release" {
		return
	}
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}
