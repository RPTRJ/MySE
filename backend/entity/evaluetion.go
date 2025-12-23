package entity

import (
	"time"
	"gorm.io/gorm"
)

type Evaluation struct {
	gorm.Model `valid:"-"`

	Criteria_Name string    `json:"criteria_name" valid:"required~Criteria_Name is required,stringlength(3|200)~Criteria_Name must be between 3-200 characters"`
	Max_Score     float64   `json:"max_score" valid:"required~Max_Score is required"`  // FIXED: removed range for float
	Total_Score   float64   `json:"total_score" valid:"required~Total_Score is required"`  // FIXED: removed range for float
	Evaluetion_at time.Time `json:"evaluetion_at" valid:"required~Evaluetion_at is required"`

	PortfolioSubmissionID uint                 `json:"portfolio_submission_id" valid:"required~PortfolioSubmissionID is required"`
	PortfolioSubmission   *PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission" valid:"-"`

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" valid:"-"`

	ScorecardID uint       `json:"scorecard_id" valid:"required~ScorecardID is required"`
	Scorecard   *Scorecard `gorm:"foreignKey:ScorecardID" json:"scorecard" valid:"-"`
}