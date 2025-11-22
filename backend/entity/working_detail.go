package entity

import (
	"time"

	"gorm.io/gorm"
)

type WorkingDetail struct {
	gorm.Model
	WorkingAt   time.Time `json:"working_at"`
	Description string    `json:"description"`

	TypeWorkingID uint         `json:"type_working_id"`
	TypeWorking   *TypeWorking `gorm:"foreignKey:TypeWorkingID" json:"type_working"`
}
