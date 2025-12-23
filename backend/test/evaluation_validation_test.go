package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestEvaluationValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)
	t.Run("Valid Evaluation", func(t *testing.T) {
		g := NewGomegaWithT(t)
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
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Criteria_Name is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "",
			Max_Score:             100.0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Criteria_Name"))
	})

	t.Run("Max_Score is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Max_Score"))
	})

	t.Run("Total_Score must not exceed Max_Score", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           110.0,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Total_Score must be non-negative", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           -10.0,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Total_Score"))
	})

	t.Run("Evaluetion_at is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Time{},
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("PortfolioSubmissionID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 0,
			UserID:                1,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("PortfolioSubmissionID"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                0,
			ScorecardID:           1,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})

	t.Run("ScorecardID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		evaluation := entity.Evaluation{
			Criteria_Name:         "Design Quality",
			Max_Score:             100.0,
			Total_Score:           85.5,
			Evaluetion_at:         time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
			ScorecardID:           0,
		}

		ok, err := govalidator.ValidateStruct(&evaluation)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("ScorecardID"))
	})
}