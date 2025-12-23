package entity

import (
	"gorm.io/gorm"
	"time"
)

type Announcement struct {
	gorm.Model `valid:"-"`
	
	Title                string     `json:"title" valid:"required~Title is required,stringlength(3|200)~Title must be between 3-200 characters"`
	Content              string     `json:"content" valid:"required~Content is required,stringlength(10|5000)~Content must be between 10-5000 characters"`
	Is_Pinned            *bool      `json:"is_pinned" valid:"-"`
	Scheduled_Publish_At *time.Time `json:"scheduled_publish_at" valid:"-"`
	Published_At         *time.Time `json:"published_at" valid:"-"`
	Expires_At           *time.Time `json:"expires_at" valid:"-"`
	Send_Notification    bool       `json:"send_notification" valid:"-"`
	Status               string     `json:"status" valid:"required~Status is required,matches(^(draft|published|scheduled|expired|archived)$)~Status must be draft, published, scheduled, expired, or archived"`  // FIXED: use matches instead of in

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" valid:"-"`

	CetagoryID uint      `json:"cetagory_id" valid:"required~CetagoryID is required"`
	Cetagory   *Cetagory `gorm:"foreignKey:CetagoryID" json:"cetagory" valid:"-"`
}