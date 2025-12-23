package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestAnnouncementValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)

	t.Run("Valid Announcement", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "published",
			UserID:            1,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Title is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "published",
			UserID:            1,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Title"))
	})

	t.Run("Content is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "published",
			UserID:            1,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Content"))
	})

	t.Run("Status is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "",
			UserID:            1,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Status"))
	})

	t.Run("Status must be valid value", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "invalid_status",
			UserID:            1,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Status"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "published",
			UserID:            0,
			CetagoryID:        1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})

	t.Run("CetagoryID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		announcement := entity.Announcement{
			Title:             "Important Announcement",
			Content:           "This is the announcement content",
			Is_Pinned:         &isPinned,
			Send_Notification: true,
			Status:            "published",
			UserID:            1,
			CetagoryID:        0,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("CetagoryID"))
	})

	t.Run("Scheduled_Publish_At in future for scheduled status", func(t *testing.T) {
		g := NewGomegaWithT(t)
		isPinned := false
		futureTime := time.Now().Add(24 * time.Hour)
		announcement := entity.Announcement{
			Title:                "Scheduled Announcement",
			Content:              "This will be published later",
			Is_Pinned:            &isPinned,
			Scheduled_Publish_At: &futureTime,
			Send_Notification:    true,
			Status:               "scheduled",
			UserID:               1,
			CetagoryID:           1,
		}

		ok, err := govalidator.ValidateStruct(&announcement)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}