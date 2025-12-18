package entity

import (
	"gorm.io/gorm"
)
type Templates struct {
	gorm.Model
	TemplateName string `json:"template_name"`
	Category     string `json:"category"`
	Description  string `json:"description"`
	Thumbnail    string `json:"thumbnail"`

	//FK
	Portfolio		 []Portfolio        `gorm:"foreignKey:TemplateID" json:"portfolio"`
	// Sections         []TemplatesSection `gorm:"many2many:TemplateSectionLink;" json:"templates_sections"`
	TemplateSectionLinks []TemplateSectionLink `gorm:"foreignKey:TemplatesID" json:"template_section_links"`
}