package entity

import (
	"gorm.io/gorm"
	"time"
)

type ActivityDetail struct {
	gorm.Model
	ActivityAt  time.Time `json:"activity_at"`
	Institution string    `json:"institution"`
	Description string    `json:"description"`

	TypeActivityID uint         `json:"type_activity_id"`
	TypeActivity   *TypeActivity `gorm:"foreignKey:TypeActivityID" json:"type_activity"`
	LevelActivityID uint        `json:"level_activity_id"`
	LevelActivity   *LevelActivity `gorm:"foreignKey:LevelActivityID" json:"level_activity"`
	Images          []ActivityImage `gorm:"foreignKey:ActivityDetailID" json:"images"`
}