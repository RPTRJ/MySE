package entity

import (	
	"gorm.io/gorm"
)

type CriteriaScore struct {
	gorm.Model

	Score 	 	  	float64 `json:"score"`
	Comment 	  	string  `json:"comment"`

	// FK 
	ScoreCriteriaID 	uint         	 `json:"score_criteria_id"`
	ScoreCriteria   	ScoreCriteria  `gorm:"foreignKey:ScoreCriteriaID" json:"score_criteria"`
}