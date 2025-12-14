package entity

import(
	"gorm.io/gorm"

)

type Cetagory struct {
	gorm.Model
	Cetagory_Name string	`json:"cetagory_name"`
}