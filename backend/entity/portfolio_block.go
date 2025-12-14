package entity

import (
	"gorm.io/gorm"
	"gorm.io/datatypes"
)

type PortfolioBlock struct {
	gorm.Model
	BlockPortType  	string `json:"block_port_type"`
	BlockOrder 		int    `json:"block_order"`
	BlockStyle      datatypes.JSON `json:"block_style"`
	Content    		datatypes.JSON `json:"content"`
	
	// FK
	PortfolioSectionID uint             `json:"portfolio_section_id"`
	PortfolioSection   PortfolioSection `gorm:"foreignKey:PortfolioSectionID" json:"portfolio_section"`
}