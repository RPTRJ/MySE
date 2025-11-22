package entity

import "gorm.io/gorm"

type Education struct {
	gorm.Model
	UserID           uint            `json:"user_id"`
	User             *User           `gorm:"foreignKey:UserID" json:"user"`
	EducationLevelID uint            `json:"education_level_id"`
	EducationLevel   *EducationLevel `gorm:"foreignKey:EducationLevelID" json:"education_level"`
	CurriculumTypeID uint            `json:"curriculum_type_id"`
	CurriculumType   *CurriculumType `gorm:"foreignKey:CurriculumTypeID" json:"curriculum_type"`
	IsProjectBased   bool            `gorm:"default:false" json:"is_project_based"`
	CurriculumID uint        `json:"curriculum_id"`
    Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID" json:"curriculum"`
}

type EducationLevel struct {
	gorm.Model
	Name string `json:"name"`
}
type CurriculumType struct {
	gorm.Model
	Name string `json:"name"`
}
