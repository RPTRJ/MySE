package entity

import (
	"gorm.io/gorm"
)

type ScoreCriteria struct {
	gorm.Model
	
	Criteria_Number int     `json:"criteria_number"`
	Criteria_Name string  `json:"criteria_name"`
	Max_Score    float64 `json:"max_score"`
	Score 	 	float64 `json:"score"`
	Weight_Percent float64 `json:"weight_percent"`
	Comment 	string  `json:"comment"`
	Order_index   int     `json:"order_index"`

	// FK scorecard
	ScorecardID uint      `json:"scorecard_id"`
	Scorecard   Scorecard `gorm:"foreignKey:ScorecardID" json:"scorecard"`
}