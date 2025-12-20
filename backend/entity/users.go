package entity

import (
	"time"

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
}
