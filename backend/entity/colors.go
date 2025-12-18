package entity

import (
	"gorm.io/gorm"
)

type Colors struct {
	gorm.Model
	ColorsName 		string  	`json:"colors_name"`
	PrimaryColor 	string 		`json:"primary_color"`
	SecondaryColor	string 		`json:"secondary_color"`
	BackgroundColor string 		`json:"background_color"`
	HexValue   		string 		`json:"hex_value"`

	//FK
	Portfolio []Portfolio `gorm:"foreignKey:ColorsID" json:"portfolio"`
}