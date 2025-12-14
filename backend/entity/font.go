package entity

import (
	"gorm.io/gorm"
)

type Font struct {
	gorm.Model
	FontFamily   string `json:"font_family"`
	FontName     string `json:"font_name"`
	FontCategory string `json:"font_category"`
	FontVariant  string `json:"font_variant"`
	FontURL      string `json:"font_url"`
	IsActive     bool   `json:"is_active"`

	//FK
	Portfolio []Portfolio `gorm:"foreignKey:FontID" json:"portfolio"`
}

