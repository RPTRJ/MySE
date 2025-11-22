package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	FirstNameTH     string     `json:"first_name_th"`
	LastNameTH      string     `json:"last_name_th"`
	FirstNameEN     string     `json:"first_name_en"`
	LastNameEN      string     `json:"last_name_en"`
	Email           string     `json:"email"`
	Password        string     `json:"-"`
	ProfileImageURL string     `json:"profile_image_url"`
	IDNumber        string     `json:"id_number"`
	Phone           string     `json:"phone"`
	Birthday        time.Time  `json:"birthday"`
	PDPAConsent     bool       `json:"pdpa_consent"`
	PDPAConsentAt   *time.Time `json:"pdpa_consent_at"`

	//FK
	AccountTypeID uint       `json:"type_id"`
	AccountType   *UserTypes `gorm:"foreignKey:AccountTypeID" json:"user_type"`
	IDDocTypeID   uint       `json:"id_type"`
	IDDocType     *IDTypes   `gorm:"foreignKey:IDDocTypeID" json:"user_id_type"`
}
