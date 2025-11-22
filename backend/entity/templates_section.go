package entity

import (
	"gorm.io/gorm"
)

type TemplatesSection struct {
	gorm.Model
	SectionName string `json:"section_name"`
	SectionKey  string `json:"section_key"`
	Description string `json:"description"`
	IsEnabled   bool   `json:"is_enabled"`
	OrderIndex  uint   `json:"order_index"`

	//FK
	TemplateID uint      `json:"template_id"`
	Template   *Templates `gorm:"foreignKey:TemplateID" json:"template"`
}