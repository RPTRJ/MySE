package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/seed"
)

func main() {
	loadEnv()
	config.ConnectionDatabase()
	
	seed.CurriculumSeed()
	seed.SeedUsers()
	seed.SeedTemplateBlocks()
	seed.SeedTypeWorkings()
	seed.SeedActivities()
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
