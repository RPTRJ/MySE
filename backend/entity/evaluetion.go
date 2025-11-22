package entity

import (
	"time"

	"gorm.io/gorm"
)

type Evaluation struct {
	gorm.Model

	Criteria_Name string  `json:"criteria_name"`
	Max_Score     float64 `json:"max_score"`
	Total_Score   float64 `json:"total_score"`
	Evaluetion_at time.Time `json:"evaluetion_at"`

	// FK 

	PortfolioSubmissionID uint                `json:"portfolio_submission_id"`
	PortfolioSubmission   PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"user"`

	ScorecardID uint `json:"scorecard_id"`
	Scorecard   Scorecard `gorm:"foreignKey:ScorecardID" json:"scorecard"`
}
