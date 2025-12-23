package entity

import (
	"time"
	"gorm.io/gorm"
)

type PortfolioSubmission struct {
	gorm.Model `valid:"-"`

	Version            int        `json:"version" valid:"required~Version is required,range(1|1000)~Version must be at least 1"`
	Status             string     `json:"status" valid:"required~Status is required,matches(^(draft|submitted|under_review|approved|rejected|revision_required)$)~Status must be draft, submitted, under_review, approved, rejected, or revision_required"`  // FIXED: use matches instead of in
	Submission_at      time.Time  `json:"submission_at" valid:"required~Submission_at is required"`
	ReviewedAt         *time.Time `json:"reviewed_at" valid:"-"`
	ApprovedAt         *time.Time `json:"approved_at" valid:"-"`
	Is_current_version bool       `json:"is_current_version" valid:"-"`

	PortfolioID uint       `json:"portfolio_id" valid:"required~PortfolioID is required"`
	Portfolio   *Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio" valid:"-"`

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" valid:"-"`
}