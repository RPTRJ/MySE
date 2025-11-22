package entity

import (
	"gorm.io/gorm"
	"time"
)

type Feedback struct {
	gorm.Model

	Overall_comment 		string `json:"overall_comment"`
	Strengths       		string `json:"strengths"`
	Areas_for_improvement 	string `json:"areas_for_improvement"`
	Create_at 			time.Time `json:"create_at"`

	// FK
	PortfolioSubmissionID uint                `json:"portfolio_submission_id"`
	PortfolioSubmission   PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"user"`
}