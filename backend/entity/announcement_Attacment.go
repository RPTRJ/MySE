package entity

import (

	"gorm.io/gorm"

	"time"
)

type Announcement_Attachment struct {
	gorm.Model

	File_name      string    `json:"file_name"`
	File_path       string    `json:"file_path"` //resolve to URL in frontend
	Uploaded_At    time.Time `json:"uploaded_at"`

	//FK
	AnnouncementID *uint        `json:"announcement_id"`
	Announcement   Announcement `json:"announcement"`

	CetagoryID  *uint     `json:"cetagory_id"`
	Cetagory    Cetagory  `json:"cetagory"`
}