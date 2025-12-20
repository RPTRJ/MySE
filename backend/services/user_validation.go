package services

import (
	"errors"
	"strings"
	"unicode"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team14/backend/entity"
)

var (
	ErrUserRequired         = errors.New("user is required")
	ErrValidationFailed     = errors.New("validation failed")
	ErrMixedLanguageNames   = errors.New("use either Thai names or English names, not both")
	ErrThaiNamesRequired    = errors.New("Thai users must provide names in Thai")
	ErrEnglishNamesRequired = errors.New("Foreign users must provide names in English")
	ErrNameRequired         = errors.New("name is required in Thai or English")
)

type NameLanguage int

const (
	NameLanguageNone NameLanguage = iota
	NameLanguageThai
	NameLanguageEnglish
	NameLanguageMixed
)

func ValidateUser(u *entity.User) error {
	if u == nil {
		return ErrUserRequired
	}

	if ok, err := govalidator.ValidateStruct(u); err != nil {
		return err
	} else if !ok {
		return ErrValidationFailed
	}

	return validateUserNames(u)
}

func ValidateUserForRegistration(u *entity.User) error {
	if u == nil {
		return ErrUserRequired
	}

	if ok, err := govalidator.ValidateStruct(u); err != nil {
		return err
	} else if !ok {
		return ErrValidationFailed
	}

	lang := detectNameLanguage(u)
	if lang == NameLanguageNone {
		return nil
	}

	// ถ้ามีชื่อแล้ว ค่อยตรวจเข้มเหมือนเดิม
	return validateUserNames(u)
}

func validateUserNames(u *entity.User) error {
	lang := detectNameLanguage(u)

	switch lang {
	case NameLanguageMixed:
		return ErrMixedLanguageNames
	case NameLanguageThai:
		return validateThaiNames(u.FirstNameTH, u.LastNameTH)
	case NameLanguageEnglish:
		return validateEnglishNames(u.FirstNameEN, u.LastNameEN)
	case NameLanguageNone:
		return ErrNameRequired
	}

	return nil
}

func detectNameLanguage(u *entity.User) NameLanguage {
	hasThai := hasContent(u.FirstNameTH) || hasContent(u.LastNameTH)
	hasEnglish := hasContent(u.FirstNameEN) || hasContent(u.LastNameEN)

	switch {
	case hasThai && hasEnglish:
		return NameLanguageMixed
	case hasThai:
		return NameLanguageThai
	case hasEnglish:
		return NameLanguageEnglish
	default:
		return NameLanguageNone
	}
}

func validateThaiNames(firstName, lastName string) error {
	if !isThaiText(firstName) || !isThaiText(lastName) {
		return ErrThaiNamesRequired
	}
	return nil
}

func validateEnglishNames(firstName, lastName string) error {
	if !isEnglishText(firstName) || !isEnglishText(lastName) {
		return ErrEnglishNamesRequired
	}
	return nil
}

func hasContent(s string) bool {
	return strings.TrimSpace(s) != ""
}

func isThaiText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, r := range value {
		if isAllowedWhitespace(r) {
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
		if isAllowedWhitespace(r) {
			continue
		}
		if !unicode.In(r, unicode.Latin) || !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

func isAllowedWhitespace(r rune) bool {
	return r == ' ' || r == '-' || r == '\''
}
