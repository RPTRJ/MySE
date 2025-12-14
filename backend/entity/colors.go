package entity

import (
	"gorm.io/gorm"
)

type Colors struct {
	gorm.Model
	ColorsName string `json:"colors_name"`
	HexValue   string `json:"hex_value"`

	//FK
	Portfolio []Portfolio `gorm:"foreignKey:ColorsID" json:"portfolio"`
}