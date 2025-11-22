package entity

import (
	"gorm.io/gorm"
)

type Working struct {
	gorm.Model
	WorkingName string `json:"working_name"`
	Status	  string `json:"status"`

	WorkingDetailID uint          `json:"working_detail_id"`
	WorkingDetail   *WorkingDetail `gorm:"foreignKey:WorkingDetailID" json:"working_detail"`
	UserID         uint          `json:"user_id"`
	User           *User         `gorm:"foreignKey:UserID" json:"user"`

}