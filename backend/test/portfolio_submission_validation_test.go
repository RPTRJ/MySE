package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestPortfolioSubmissionValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)
	
	t.Run("Valid PortfolioSubmission", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "submitted",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Version must be positive", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            0,
			Status:             "submitted",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Version"))
	})

	t.Run("Status is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Status"))
	})

	t.Run("Status must be valid value", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "invalid_status",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Status"))
	})

	t.Run("Submission_at is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "submitted",
			Submission_at:      time.Time{},
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("PortfolioID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "submitted",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        0,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("PortfolioID"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "submitted",
			Submission_at:      time.Now(),
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             0,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})

	t.Run("ReviewedAt after Submission_at", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submissionTime := time.Now()
		reviewedTime := submissionTime.Add(1 * time.Hour)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "under_review",
			Submission_at:      submissionTime,
			ReviewedAt:         &reviewedTime,
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("ApprovedAt after ReviewedAt", func(t *testing.T) {
		g := NewGomegaWithT(t)
		submissionTime := time.Now()
		reviewedTime := submissionTime.Add(1 * time.Hour)
		approvedTime := reviewedTime.Add(1 * time.Hour)
		submission := entity.PortfolioSubmission{
			Version:            1,
			Status:             "approved",
			Submission_at:      submissionTime,
			ReviewedAt:         &reviewedTime,
			ApprovedAt:         &approvedTime,
			Is_current_version: true,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(&submission)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}