package entity

import (
	"gorm.io/gorm"
)

type PortfolioSection struct {
	gorm.Model
	SectionKey   string `json:"section_key"`
	SectionTitle string `json:"section_title"`
	IsEnabled	 bool   `json:"is_enabled"`
	SectionOrder int    `json:"section_order"`

	// FK
	PortfolioID  uint      `json:"portfolio_id"`
	Portfolio    Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio"`
}