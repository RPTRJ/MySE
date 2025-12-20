package entity

import (
	"gorm.io/gorm"
	"gorm.io/datatypes"
)

type Portfolio struct {
	gorm.Model
	PortfolioName 	string `json:"portfolio_name"`
	Decription   	string `json:"description"`
	Status       	string `json:"status"`
	PortfolioStyle 	datatypes.JSON `json:"portfolio_style"`
	
	// FK
	TemplateID   *uint   `json:"template_id"`
	Template     Templates `gorm:"foreignKey:TemplateID" json:"template"`
	UserID       uint   `json:"user_id"`
	User         User   `gorm:"foreignKey:UserID" json:"user"`
	ColorsID	 uint   `json:"colors_id"`
	Colors       Colors `gorm:"foreignKey:ColorsID" json:"colors"`
	FontID		 uint   `json:"font_id"`
	Font         Font   `gorm:"foreignKey:FontID" json:"font"`

	// one to many
	PortfolioSections []PortfolioSection `gorm:"foreignKey:PortfolioID" json:"portfolio_sections"`
	PortfolioWorks    []PortfolioWork    `gorm:"foreignKey:PortfolioID" json:"portfolio_works"`
	
}