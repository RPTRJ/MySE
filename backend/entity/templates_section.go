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
	Templates 	[]Templates   `gorm:"many2many:TemplateSectionLink;" json:"templates"`
	Blocks 		[]TemplatesBlock `gorm:"many2many:SectionBlock;" json:"templates_blocks"`
}