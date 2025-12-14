package entity

import (
	"gorm.io/gorm"
)

type Activity struct {
	gorm.Model
	ActivityName string `json:"activity_name"`

	ActivityDetailID uint            `json:"activity_detail_id"`
	ActivityDetail   *ActivityDetail `gorm:"foreignKey:ActivityDetailID" json:"activity_detail"`
	UserID          uint            `json:"user_id"`
	User            *User           `gorm:"foreignKey:UserID" json:"user"`
	RewardID       uint            `json:"reward_id"`
	Reward         *Reward         `gorm:"foreignKey:rewardID" json:"reward"`
}