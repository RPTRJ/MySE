package entity

import "gorm.io/gorm"

type Course struct {
	gorm.Model
	CourseCode   string `json:"course_code"`
	CourseNameTH string `json:"course_name_th"`
	CourseNameEN string `json:"course_name_en"`
	Credits      int    `json:"credits"`
	Category     int    `json:"category"`
	Description  string `json:"description" gorm:"type:text"`
}
