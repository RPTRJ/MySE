package seed

import (
	"errors"
	"log"
	"time"

	"github.com/RPTRJ/MySE/backend/config"
	"github.com/RPTRJ/MySE/backend/entity"
	"gorm.io/gorm"
)

func SeedUsers() {
	db := config.GetDB()

	accountTypeID := ensureUserType(db, "student")
	idTypeID := ensureIDType(db, "citizen_id")
	if accountTypeID == 0 || idTypeID == 0 {
		log.Println("skip seeding users because base reference data missing")
		return
	}

	parseDate := func(value string) time.Time {
		t, err := time.Parse("02-01-2006", value)
		if err != nil {
			return time.Time{}
		}
		return t
	}

	users := []entity.User{
		{
			FirstNameTH:     "สมชาย",
			LastNameTH:      "ใจดี",
			FirstNameEN:     "Somchai",
			LastNameEN:      "Jaidee",
			Email:           "somchai@example.com",
			Password:        "password123",
			ProfileImageURL: "",
			IDNumber:        "1234567890123",
			Phone:           "0812345678",
			Birthday:        parseDate("05-01-1995"),
			PDPAConsent:     true,
			AccountTypeID:   accountTypeID,
			IDDocTypeID:     idTypeID,
		},
		{
			FirstNameTH:     "ศิรภัสสร",
			LastNameTH:      "รุ่งเรือง",
			FirstNameEN:     "Sirapasorn",
			LastNameEN:      "Rungruang",
			Email:           "sirapasorn@example.com",
			Password:        "password123",
			ProfileImageURL: "",
			IDNumber:        "9876543210987",
			Phone:           "0898765432",
			Birthday:        parseDate("20-04-1997"),
			PDPAConsent:     true,
			AccountTypeID:   accountTypeID,
			IDDocTypeID:     idTypeID,
		},
	}

	for _, user := range users {
		hashed, err := config.HashPassword(user.Password)
		if err != nil {
			log.Printf("skip user %s, hash error: %v\n", user.Email, err)
			continue
		}
		user.Password = hashed
		if err := db.Where("email = ?", user.Email).FirstOrCreate(&entity.User{}, user).Error; err != nil {
			log.Printf("failed to seed user %s: %v\n", user.Email, err)
		}
	}
}

func ensureUserType(db *gorm.DB, name string) uint {
	var userType entity.UserTypes
	if err := db.Where("type_name = ?", name).First(&userType).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("failed to query user type %s: %v\n", name, err)
			return 0
		}
		userType.TypeName = name
		if err := db.Create(&userType).Error; err != nil {
			log.Printf("failed to create user type %s: %v\n", name, err)
			return 0
		}
	}
	return userType.ID
}

func ensureIDType(db *gorm.DB, name string) uint {
	var idType entity.IDTypes
	if err := db.Where("id_name = ?", name).First(&idType).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("failed to query id type %s: %v\n", name, err)
			return 0
		}
		idType.IDName = name
		if err := db.Create(&idType).Error; err != nil {
			log.Printf("failed to create id type %s: %v\n", name, err)
			return 0
		}
	}
	return idType.ID
}
