package test

import (
	"testing"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestCriteriaScoreValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid CriteriaScore", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Score:           85.5,
			Comment:         "Good performance",
			ScoreCriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Score is required", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Comment:         "Good performance",
			ScoreCriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Score"))
	})

	t.Run("Score must be non-negative", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Score:           -10.5,
			Comment:         "Negative score",
			ScoreCriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Score"))
	})

	t.Run("Score must not exceed 100", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Score:           150.0,
			Comment:         "Exceeds maximum",
			ScoreCriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Score"))
	})

	t.Run("Comment is optional", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Score:           75.0,
			Comment:         "",
			ScoreCriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("ScoreCriteriaID is required", func(t *testing.T) {
		criteriaScore := entity.CriteriaScore{
			Score:           85.5,
			Comment:         "Good performance",
			ScoreCriteriaID: 0,
		}

		ok, err := govalidator.ValidateStruct(criteriaScore)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("ScoreCriteriaID"))
	})
}