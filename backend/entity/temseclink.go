package entity

import (
	"gorm.io/gorm"
)

type TemplateSectionLink struct {
	gorm.Model
	TemplatesID uint       `json:"templates_id"`
	Templates   *Templates `gorm:"foreignKey:TemplatesID" json:"templates"`
	TemplatesSectionID uint              `json:"templates_section_id"`
	TemplatesSection   *TemplatesSection `gorm:"foreignKey:TemplatesSectionID" json:"templates_section"`
}