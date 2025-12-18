package entity

import "gorm.io/gorm"

type Education struct {
	gorm.Model
	UserID           uint            `json:"user_id"`
	User             *User           `gorm:"foreignKey:UserID" json:"user"`
	EducationLevelID uint            `json:"education_level_id"`
	EducationLevel   *EducationLevel `gorm:"foreignKey:EducationLevelID" json:"education_level"`
	SchoolID         *uint           `json:"school_id,omitempty"`
	School           *School         `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
	SchoolTypeID     uint            `json:"school_type_id"`
	SchoolType       *SchoolType     `gorm:"foreignKey:SchoolTypeID" json:"school_type"`
	CurriculumTypeID uint            `json:"curriculum_type_id"`
	CurriculumType   *CurriculumType `gorm:"foreignKey:CurriculumTypeID" json:"curriculum_type"`
	IsProjectBased   bool            `gorm:"default:false" json:"is_project_based"`
	CurriculumID     *uint           `json:"curriculum_id,omitempty"`
	Curriculum       *Curriculum     `gorm:"foreignKey:CurriculumID" json:"curriculum,omitempty"`
}

type EducationLevel struct {
	gorm.Model
	Name string `json:"name"`
}

type SchoolType struct {
	gorm.Model
	Name string `json:"name"`
}
type CurriculumType struct {
	gorm.Model
	Name string `json:"name"`
}

type School struct {
	gorm.Model
	Name           string      `json:"name"`
	SchoolTypeID   uint        `json:"school_type_id"`
	SchoolType     *SchoolType `gorm:"foreignKey:SchoolTypeID" json:"school_type"`
	IsProjectBased bool        `json:"is_project_based" gorm:"default:false"`
}
