package entity

import "gorm.io/gorm"

type AdviceSkill struct {
	gorm.Model
	AdviceID uint    `json:"advice_id"`
	Advice   *Advice `gorm:"foreignKey:AdviceID" json:"advice"`

	SkillID uint   `json:"skill_id"`
	Skill   *Skill `gorm:"foreignKey:SkillID" json:"skill"`

	Description string `json:"description" gorm:"type:text"`
}
