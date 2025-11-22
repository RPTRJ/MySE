package entity

import "gorm.io/gorm"

type BTDTestScore struct {
	gorm.Model
	UserID       uint    `json:"user_id"`
	User         *User   `gorm:"foreignKey:UserID" json:"user"`
	TestType     string  `json:"test_type"`
	Subject      string  `json:"subject"`
	RawScore     float64 `json:"raw_score"`
	ExamYear     int     `json:"exam_year"`
	CertFilePath string  `json:"cert_file_path"`
}
