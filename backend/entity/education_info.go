package entity

import (
	"gorm.io/gorm"
)

type EducationStatus string

const (
	EducationStatusCurrent   EducationStatus = "current"
	EducationStatusGraduated EducationStatus = "graduated"
	EducationStatusOther     EducationStatus = "other"
)

type Education struct {
	gorm.Model
	UserID           uint            `json:"user_id" gorm:"uniqueIndex;not null"`
	User             *User           `gorm:"foreignKey:UserID" json:"user"`
	EducationLevelID uint            `json:"education_level_id" gorm:"index;not null"`
	EducationLevel   *EducationLevel `gorm:"foreignKey:EducationLevelID" json:"education_level"`
	SchoolID         *uint           `json:"school_id,omitempty" gorm:"index"`
	School           *School         `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
	SchoolName       string          `json:"school_name,omitempty" gorm:"size:255"`
	SchoolTypeID     *uint           `json:"school_type_id,omitempty" gorm:"index"`
	SchoolType       *SchoolType     `gorm:"foreignKey:SchoolTypeID" json:"school_type,omitempty"`
	CurriculumTypeID *uint           `json:"curriculum_type_id,omitempty" gorm:"index"`
	CurriculumType   *CurriculumType `gorm:"foreignKey:CurriculumTypeID" json:"curriculum_type,omitempty"`
	IsProjectBased   *bool           `json:"is_project_based,omitempty"`
}

type EducationLevel struct {
	gorm.Model
	Name string `json:"name" gorm:"size:100;uniqueIndex;not null"`
}

type SchoolType struct {
	gorm.Model
	Name string `json:"name" gorm:"size:100;uniqueIndex;not null"`
}

type CurriculumType struct {
	gorm.Model
	Name         string      `json:"name" gorm:"size:150;not null;index:idx_curriculum_name_schooltype,unique"`
	SchoolTypeID *uint       `json:"school_type_id,omitempty" gorm:"index:idx_curriculum_name_schooltype,unique"`
	SchoolType   *SchoolType `gorm:"foreignKey:SchoolTypeID" json:"school_type,omitempty"`
}

type School struct {
	gorm.Model
	Code           string      `json:"code,omitempty" gorm:"size:50;uniqueIndex"`
	Name           string      `json:"name" gorm:"size:255;index;not null"`
	SchoolTypeID   uint        `json:"school_type_id" gorm:"index;not null"`
	SchoolType     *SchoolType `gorm:"foreignKey:SchoolTypeID" json:"school_type"`
	IsProjectBased bool        `json:"is_project_based" gorm:"default:false"`
}
