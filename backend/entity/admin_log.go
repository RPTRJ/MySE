package entity

import(
	"gorm.io/gorm"

	"time"
)

type Admin_Log struct {
	gorm.Model
	
	Action_Type   string    `json:"action_type"`
	Action_At     time.Time `json:"action_at"`

	//FK
	UserID *uint `json:"user_id"`//admin who perform action
	User   User  `json:"user"`

	AnnouncementID *uint        `json:"announcement_id"`
	Announcement   Announcement `json:"announcement"`
}