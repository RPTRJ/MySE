package entity

import (
	"gorm.io/gorm"
)

type TemplatesBlock struct {
	gorm.Model
	BlockName   string `json:"block_name"`
	BlockType   string `json:"block_type"`
	OrderIndex  uint   `json:"order_index"`
	//ยังไม่ได้เขียน feild พวก jsonสำหรับเก็บข้อมูล block ต่างๆ เช่น text, image, video, file, button, etc.

	//FK
	SectionID uint             `json:"section_id"`
	Section   *TemplatesSection `gorm:"foreignKey:SectionID" json:"section"`
}
