package entity

import (	
	"gorm.io/gorm"
)

type CriteriaScore struct {
	gorm.Model

	Score 	 	  	float64 `json:"score" valid:"required~Score is required,range(0|100)~Score must be between 0 and 100"`
	Comment 	  	string  `json:"comment"`

	// FK 
	ScoreCriteriaID 	uint         	 `json:"score_criteria_id" valid:"required~ScoreCriteriaID is required"`
	ScoreCriteria   	*ScoreCriteria  `gorm:"foreignKey:ScoreCriteriaID" json:"score_criteria"`
}