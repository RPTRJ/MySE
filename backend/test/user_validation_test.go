package test

import (
	"testing"
	"time"

	"github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/services"
)

func validUser() entity.User {
	return entity.User{
		FirstNameTH:     "สมชาย",
		LastNameTH:      "ใจดี",
		Email:           "user@example.com",
		Password:        "secret123",
		ProfileImageURL: "https://example.com/avatar.png",
		IDNumber:        "1234567890123",
		Phone:           "0812345678",
		Birthday:        time.Date(1990, time.January, 1, 0, 0, 0, 0, time.UTC),
		PDPAConsent:     true,
		AccountTypeID:   1,
		IDDocTypeID:     1,
		IDDocType:       &entity.IDTypes{IDName: "citizen_id"},
	}
}

func TestUserValidPass(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	user := validUser()

	err := services.ValidateUser(&user)
	g.Expect(err).To(gomega.BeNil())
}

func TestUserEmailRequired(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	user := validUser()
	user.Email = ""

	err := services.ValidateUser(&user)
	g.Expect(err).ToNot(gomega.BeNil())
	g.Expect(err.Error()).To(gomega.ContainSubstring("Email is required"))
}

func TestUserBirthdayRequired(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	user := validUser()
	user.Birthday = time.Time{}

	err := services.ValidateUser(&user)
	g.Expect(err).ToNot(gomega.BeNil())
	g.Expect(err.Error()).To(gomega.ContainSubstring("Birthday is required"))
}

func TestUserGCodePattern(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	user := validUser()
	user.IDDocTypeID = 2
	user.IDDocType = &entity.IDTypes{IDName: "g_code"}
	user.IDNumber = "G23"

	err := services.ValidateUser(&user)
	g.Expect(err).ToNot(gomega.BeNil())
	g.Expect(err).To(gomega.Equal(services.ErrGCodeInvalid))
}

func TestUserEnglishNamesMustBeEnglish(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	user := validUser()
	user.FirstNameTH = ""
	user.LastNameTH = ""
	user.FirstNameEN = "สมชาย"
	user.LastNameEN = "รักเรียน"

	err := services.ValidateUser(&user)
	g.Expect(err).ToNot(gomega.BeNil())
	g.Expect(err).To(gomega.Equal(services.ErrEnglishNamesRequired))
}
