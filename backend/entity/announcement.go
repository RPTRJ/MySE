package entity

import(
	"time"
	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	Is_Pinned    bool      `json:"is_pinned"`
	Scheduled_Publish_At time.Time `json:"scheduled_publish_at"`
	Published_At time.Time `json:"published_at"`
	Expires_At   time.Time `json:"expires_at"`
	Send_Notification bool    `json:"send_notification"`

	//FK
	UserID *uint `json:"user_id"` //admin who create announcement
	User   User  `json:"user"`

	CetagoryID *uint    `json:"cetagory_id"`
	Cetagory   Cetagory `json:"cetagory"`
}
