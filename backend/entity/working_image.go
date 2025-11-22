package entity

import (
	"gorm.io/gorm"
)

type WorkingImage struct {
	gorm.Model
	WorkingImageURL string `json:"working_image_url"`

	WorkingDetailID uint `json:"working_detail_id"`
	WorkingDetail *WorkingDetail `gorm:"foreignKey:WorkingDetailID" json:"working_detail"`
}