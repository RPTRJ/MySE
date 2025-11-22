package entity

import (
	"gorm.io/gorm"
)

type Scorecard struct {
	gorm.Model

	Total_Score  	float64 `json:"total_score"`
	Max_Score    	float64 `json:"max_score"`
	General_Comment string  `json:"general_comment"`
	Create_at		string  `json:"create_at"`

	// FK
	PortfolioSubmissionID uint                `json:"portfolio_submission_id"`
	PortfolioSubmission   PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"user"`

}