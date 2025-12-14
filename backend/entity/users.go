package entity

import (
	"errors"
	"strings"
	"time"
	"unicode"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	FirstNameTH      string     `json:"first_name_th" valid:"optional"`
	LastNameTH       string     `json:"last_name_th" valid:"optional"`
	FirstNameEN      string     `json:"first_name_en" valid:"optional"`
	LastNameEN       string     `json:"last_name_en" valid:"optional"`
	Email            string     `json:"email" valid:"required~Email is required,email~Email is invalid"`
	Password         string     `json:"-" valid:"optional"`
	ProfileImageURL  string     `json:"profile_image_url" valid:"optional,url~Profile image must be a valid URL"`
	IDNumber         string     `json:"id_number" valid:"optional"`
	Phone            string     `json:"phone" valid:"optional"`
	Birthday         time.Time  `json:"birthday" valid:"required~Birthday is required"`
	PDPAConsent      bool       `json:"pdpa_consent" valid:"optional"`
	PDPAConsentAt    *time.Time `json:"pdpa_consent_at" valid:"optional"`
	ProfileCompleted bool       `json:"profile_completed" gorm:"default:false"`

	//FK
	AccountTypeID uint       `json:"type_id" valid:"required~Account type is required"`
	AccountType   *UserTypes `gorm:"foreignKey:AccountTypeID" json:"user_type"`
	IDDocTypeID   uint       `json:"id_type" valid:"required~ID doc type is required"`
	IDDocType     *IDTypes   `gorm:"foreignKey:IDDocTypeID" json:"user_id_type"`

	// Relations
	Education *Education `gorm:"foreignKey:UserID" json:"education,omitempty"`
}

// Validate enforces base govalidator rules plus name locale rules:
// - Thai users must provide Thai names only.
// - Foreign users must provide English names only.
// - Must choose exactly one language (not both, not neither).
func (u User) Validate() error {
	if ok, err := govalidator.ValidateStruct(u); err != nil {
		return err
	} else if !ok {
		return errors.New("validation failed")
	}

	// Allow missing names at registration / pre-onboarding; enforce language rules only when names are provided.
	namesAllEmpty := strings.TrimSpace(u.FirstNameTH+u.LastNameTH+u.FirstNameEN+u.LastNameEN) == ""
	if namesAllEmpty {
		return nil
	}

	hasThai := strings.TrimSpace(u.FirstNameTH) != "" || strings.TrimSpace(u.LastNameTH) != ""
	hasEnglish := strings.TrimSpace(u.FirstNameEN) != "" || strings.TrimSpace(u.LastNameEN) != ""

	switch {
	case hasThai && hasEnglish:
		return errors.New("use either Thai names or English names, not both")
	case hasThai:
		if !isThaiText(u.FirstNameTH) || !isThaiText(u.LastNameTH) {
			return errors.New("Thai users must provide names in Thai")
		}
	case hasEnglish:
		if !isEnglishText(u.FirstNameEN) || !isEnglishText(u.LastNameEN) {
			return errors.New("Foreign users must provide names in English")
		}
	default:
		return errors.New("name is required in Thai or English")
	}

	return nil
}

// OnboardingCompleted returns true when the user has provided base info and accepted PDPA.
// Existing users that already consented (and have name/phone) are treated as completed even if ProfileCompleted is false.
func (u User) OnboardingCompleted() bool {
	if u.ProfileCompleted && u.PDPAConsent && u.PDPAConsentAt != nil {
		return true
	}

	namesFilled := strings.TrimSpace(u.FirstNameTH+u.LastNameTH+u.FirstNameEN+u.LastNameEN) != ""
	phoneFilled := strings.TrimSpace(u.Phone) != ""

	return u.PDPAConsent && u.PDPAConsentAt != nil && namesFilled && phoneFilled
}

func isThaiText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}
	for _, r := range value {
		if r == ' ' || r == '-' || r == '\'' {
			continue
		}
		if !unicode.In(r, unicode.Thai) {
			return false
		}
	}
	return true
}

func isEnglishText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}
	for _, r := range value {
		if r == ' ' || r == '-' || r == '\'' {
			continue
		}
		if !unicode.In(r, unicode.Latin) || !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}
