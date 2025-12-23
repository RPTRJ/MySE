package entity

import "gorm.io/gorm"

type Scorecard struct {
	gorm.Model `valid:"-"`

	Total_Score     float64 `json:"total_score" valid:"required~Total_Score is required"`  // FIXED: removed range for float
	Max_Score       float64 `json:"max_score" valid:"required~Max_Score is required"`  // FIXED: removed range for float
	General_Comment string  `json:"general_comment" valid:"-"`
	Create_at       string  `json:"create_at" valid:"required~Create_at is required"`

	PortfolioSubmissionID uint                 `json:"portfolio_submission_id" valid:"required~PortfolioSubmissionID is required"`
	PortfolioSubmission   *PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission" valid:"-"`

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" valid:"-"`
}