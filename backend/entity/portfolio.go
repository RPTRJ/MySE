package entity

import (
	"gorm.io/gorm"
)

type Portfolio struct {
	gorm.Model
	PortfolioName string `json:"portfolio_name"`
	Decription   string `json:"description"`
	Status       string `json:"status"`
	
	// FK
	TemplateID   uint   `json:"template_id"`
	Template     Templates `gorm:"foreignKey:TemplateID" json:"template"`
	UserID       uint   `json:"user_id"`
	User         User   `gorm:"foreignKey:UserID" json:"user"`
}