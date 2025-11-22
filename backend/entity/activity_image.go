package entity

import (
	"gorm.io/gorm"
)

type ActivityImage struct {
	gorm.Model
	ImageURL   string `json:"image_url"`

	ActivityDetailID uint            `json:"activity_detail_id"`
	ActivityDetail   *ActivityDetail `gorm:"foreignKey:ActivityDetailID" json:"activity_detail"`
}