package entity

import "gorm.io/gorm"

type AdviceCourse struct {
	gorm.Model
	AdviceID uint    `json:"advice_id"`
	Advice   *Advice `gorm:"foreignKey:AdviceID" json:"advice"`

	CourseID uint    `json:"course_id"`
	Course   *Course `gorm:"foreignKey:CourseID" json:"course"`

	Semester   int  `json:"semester"`
	Year       int  `json:"year"`
	IsRequired bool `json:"is_required"`
}
