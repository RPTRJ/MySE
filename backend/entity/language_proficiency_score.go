package entity

import (
	"time"

	"gorm.io/gorm"
)

type LanguageProficiencyScore struct {
	gorm.Model
	UserID       uint      `json:"user_id"`
	User         *User     `gorm:"foreignKey:UserID" json:"user"`
	TestType     string    `json:"test_type"`
	Score        string    `json:"score"`
	TestLevel    string    `json:"test_level"`
	SATMath      *int      `json:"sat_math"`
	TestDate     time.Time `json:"test_date"`
	CertFilePath string    `json:"cert_file_path"`
}
