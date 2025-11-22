package entity

import (
	"gorm.io/gorm"
)

type PortfolioBlock struct {
	gorm.Model
	BlockType  string `json:"block_type"`
	Content    string `json:"content"`
	BlockOrder int    `json:"block_order"`

	// FK
	PortfolioSectionID uint             `json:"portfolio_section_id"`
	PortfolioSection   PortfolioSection `gorm:"foreignKey:PortfolioSectionID" json:"portfolio_section"`
}