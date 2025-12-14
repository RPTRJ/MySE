package entity

import (
	"gorm.io/gorm"
	"gorm.io/datatypes"
)

type PortfolioSection struct {
	gorm.Model
	SectionPortKey   	string `json:"section_port_key"`
	SectionTitle 		string `json:"section_title"`
	IsEnabled	 		bool   `json:"is_enabled"`
	SectionOrder 		int    `json:"section_order"`
	SectionStyle 		datatypes.JSON `json:"section_style"`

	// FK
	PortfolioID  uint      `json:"portfolio_id"`
	Portfolio    Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio"`
	//many to one
	PortfolioBlocks []PortfolioBlock `gorm:"foreignKey:PortfolioSectionID" json:"portfolio_blocks"`
}