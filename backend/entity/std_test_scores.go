package entity

import "gorm.io/gorm"

// STDTestScore คือ (PAT / A-Level ฯลฯ)
type STDTestScore struct {
	gorm.Model
	UserID       uint    `json:"user_id"`
	User         *User   `gorm:"foreignKey:UserID" json:"user"`
	TestType     string  `json:"test_type"`
	Subject      string  `json:"subject"`
	RawScore     float64 `json:"raw_score"`
	ExamYear     int     `json:"exam_year"`
	CertFilePath string  `json:"cert_file_path"`
}

func (STDTestScore) TableName() string {
	return "std_test_scores"
}
