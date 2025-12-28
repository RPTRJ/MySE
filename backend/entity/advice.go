package entity

import "gorm.io/gorm"

// Advice represents the program-like entity (renamed to avoid clashing with existing Program ownership).
type Advice struct {
	gorm.Model
	ProgramCode   string `json:"program_code"`
	ProgramNameTH string `json:"program_name_th"`
	ProgramNameEN string `json:"program_name_en"`
	Description   string `json:"description" gorm:"type:text"`
	IconURL       string `json:"icon_url"`
	DurationYears int    `json:"duration_years"`
	TotalCredits  int    `json:"total_credits"`
	IsActive      bool   `json:"is_active"`

	AdviceCourses []AdviceCourse `json:"advice_courses"`
	AdviceSkills  []AdviceSkill  `json:"advice_skills"`
}
