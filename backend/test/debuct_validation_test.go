package test

import (
	"fmt"
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
)

// Run this test first to see what's actually failing
func TestDebugValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)

	fmt.Println("\n========================================")
	fmt.Println("DEBUG: Testing Evaluation")
	fmt.Println("========================================")
	
	evaluation := entity.Evaluation{
		Criteria_Name:         "Design Quality",
		Max_Score:             100.0,
		Total_Score:           85.5,
		Evaluetion_at:         time.Now(),
		PortfolioSubmissionID: 1,
		UserID:                1,
		ScorecardID:           1,
	}

	ok, err := govalidator.ValidateStruct(&evaluation)
	
	fmt.Printf("Validation Result: ok=%v\n", ok)
	if err != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err.Error())
		fmt.Printf("ERROR TYPE: %T\n", err)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("DEBUG: Testing ScoreCriteria")
	fmt.Println("========================================")
	
	criteria := entity.ScoreCriteria{
		Criteria_Number: 1,
		Criteria_Name:   "Technical Skills",
		Max_Score:       100.0,
		Score:           85.0,
		Weight_Percent:  30.0,
		Comment:         "Strong technical ability",
		Order_index:     1,
		ScorecardID:     1,
	}

	ok2, err2 := govalidator.ValidateStruct(&criteria)
	
	fmt.Printf("Validation Result: ok=%v\n", ok2)
	if err2 != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err2.Error())
		fmt.Printf("ERROR TYPE: %T\n", err2)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("DEBUG: Testing ScoreCriteria with EMPTY Comment")
	fmt.Println("========================================")
	
	criteria2 := entity.ScoreCriteria{
		Criteria_Number: 1,
		Criteria_Name:   "Technical Skills",
		Max_Score:       100.0,
		Score:           85.0,
		Weight_Percent:  30.0,
		Comment:         "",  // Empty comment
		Order_index:     1,
		ScorecardID:     1,
	}

	ok3, err3 := govalidator.ValidateStruct(&criteria2)
	
	fmt.Printf("Validation Result: ok=%v\n", ok3)
	if err3 != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err3.Error())
		fmt.Printf("ERROR TYPE: %T\n", err3)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("DEBUG: Testing Scorecard")
	fmt.Println("========================================")
	
	scorecard := entity.Scorecard{
		Total_Score:           85.5,
		Max_Score:             100.0,
		General_Comment:       "Overall good performance",
		Create_at:             "2024-01-15T10:30:00Z",
		PortfolioSubmissionID: 1,
		UserID:                1,
	}

	ok4, err4 := govalidator.ValidateStruct(&scorecard)
	
	fmt.Printf("Validation Result: ok=%v\n", ok4)
	if err4 != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err4.Error())
		fmt.Printf("ERROR TYPE: %T\n", err4)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("DEBUG: Testing Scorecard with EMPTY Comment")
	fmt.Println("========================================")
	
	scorecard2 := entity.Scorecard{
		Total_Score:           85.5,
		Max_Score:             100.0,
		General_Comment:       "",  // Empty comment
		Create_at:             "2024-01-15T10:30:00Z",
		PortfolioSubmissionID: 1,
		UserID:                1,
	}

	ok5, err5 := govalidator.ValidateStruct(&scorecard2)
	
	fmt.Printf("Validation Result: ok=%v\n", ok5)
	if err5 != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err5.Error())
		fmt.Printf("ERROR TYPE: %T\n", err5)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("DEBUG: Testing PortfolioSubmission")
	fmt.Println("========================================")
	
	submission := entity.PortfolioSubmission{
		Version:            1,
		Status:             "submitted",
		Submission_at:      time.Now(),
		Is_current_version: true,
		PortfolioID:        1,
		UserID:             1,
	}

	ok6, err6 := govalidator.ValidateStruct(&submission)
	
	fmt.Printf("Validation Result: ok=%v\n", ok6)
	if err6 != nil {
		fmt.Printf("ERROR MESSAGE: %v\n", err6.Error())
		fmt.Printf("ERROR TYPE: %T\n", err6)
	}
	fmt.Println()

	fmt.Println("========================================")
	fmt.Println("SUMMARY")
	fmt.Println("========================================")
	fmt.Printf("Evaluation: %v (should be true)\n", ok)
	fmt.Printf("ScoreCriteria with comment: %v (should be true)\n", ok2)
	fmt.Printf("ScoreCriteria empty comment: %v (should be true)\n", ok3)
	fmt.Printf("Scorecard with comment: %v (should be true)\n", ok4)
	fmt.Printf("Scorecard empty comment: %v (should be true)\n", ok5)
	fmt.Printf("PortfolioSubmission: %v (should be true)\n", ok6)
	
	if !ok || !ok2 || !ok3 || !ok4 || !ok5 || !ok6 {
		t.Errorf("One or more validations failed - check error messages above")
	}
}