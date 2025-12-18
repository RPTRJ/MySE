package entity

import (
	"time"
	"gorm.io/gorm"
)

type PortfolioSubmission struct {
	gorm.Model

	Version	   		int       `json:"version"`
	Status     		string    `json:"status"`
	Submission_at 	time.Time `json:"submission_at"`
	ReviewedAt   	*time.Time `json:"reviewed_at"`
	ApprovedAt   	*time.Time `json:"approved_at"`
	Is_current_version bool    `json:"is_current_version"`

	// FK
	PortfolioID  	uint      `json:"portfolio_id"`
	Portfolio    	Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio"`

	UserID       	uint      `json:"user_id"`
	User         	User      `gorm:"foreignKey:UserID" json:"user"`
	//ตัวuserIDนี้คือใคร submit
	//ตัวuserIDนี้คือใคร approve
	//ตัวuserIDนี้คือใคร review


}