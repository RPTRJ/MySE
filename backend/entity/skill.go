package entity

import "gorm.io/gorm"

type Skill struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`

	CurriculumSkills []CurriculumSkill `json:"curriculum_skills"`
}
