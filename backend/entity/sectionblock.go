package entity

import (
	"gorm.io/gorm"
	
)

type SectionBlock struct {
	gorm.Model
	TemplatesBlockID uint           `json:"templates_block_id"`
	TemplatesBlock   *TemplatesBlock `gorm:"foreignKey:TemplatesBlockID" json:"templates_block"`
	
	TemplatesSectionID uint            `json:"templates_section_id"`
	TemplatesSection   *TemplatesSection `gorm:"foreignKey:TemplatesSectionID" json:"templates_section"`
}