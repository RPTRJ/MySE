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
}