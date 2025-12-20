package test

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/services"
)

func validUser() entity.User {
	return entity.User{
		FirstNameTH:   "สมชาย",
		LastNameTH:    "ใจดี",
		Email:         "user@example.com",
		Password:      "secret",
		Birthday:      time.Date(1990, time.January, 1, 0, 0, 0, 0, time.UTC),
		PDPAConsent:   true,
		AccountTypeID: 1,
		IDDocTypeID:   1,
	}
}

func TestUserValidationThaiOnlySuccess(t *testing.T) {
	g := NewWithT(t)
	user := validUser()

	err := services.ValidateUser(&user)

	g.Expect(err).To(BeNil())
}

func TestUserValidationEnglishOnlySuccess(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.FirstNameTH = ""
	user.LastNameTH = ""
	user.FirstNameEN = "John"
	user.LastNameEN = "Doe"

	err := services.ValidateUser(&user)

	g.Expect(err).To(BeNil())
}

func TestUserValidationMissingNames(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.FirstNameTH = ""
	user.LastNameTH = ""
	user.FirstNameEN = ""
	user.LastNameEN = ""

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("name is required"))
}

func TestUserValidationMixedLanguagesFails(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.FirstNameEN = "John"
	user.LastNameEN = "Doe"

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("either Thai names or English names"))
}

func TestUserValidationThaiButEnglishCharactersFails(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.FirstNameTH = "John"
	user.LastNameTH = "Doe"
	user.FirstNameEN = ""
	user.LastNameEN = ""

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Thai users must provide names in Thai"))
}

func TestUserValidationEnglishButThaiCharactersFails(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.FirstNameTH = ""
	user.LastNameTH = ""
	user.FirstNameEN = "สมชาย"
	user.LastNameEN = "รักเรียน"

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Foreign users must provide names in English"))
}

func TestUserValidationInvalidEmail(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.Email = "not-an-email"

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Email is invalid"))
}

func TestUserValidationMissingAccountType(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.AccountTypeID = 0

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Account type is required"))
}

func TestUserValidationMissingIDDocType(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.IDDocTypeID = 0

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("ID doc type is required"))
}

func TestUserValidationMissingBirthday(t *testing.T) {
	g := NewWithT(t)
	user := validUser()
	user.Birthday = time.Time{}

	err := services.ValidateUser(&user)

	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Birthday is required"))
}
