package seed

import (
	"errors"
	"log"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

func SeedUsers() {
	db := config.GetDB()

	// 1. Ensure Roles (Student, Teacher, Admin)
	studentTypeID := ensureUserType(db, "Student")
	teacherTypeID := ensureUserType(db, "Teacher")
	adminTypeID := ensureUserType(db, "Admin")

	idTypeID := ensureIDType(db, "citizen_id")
	_ = ensureIDType(db, "passport")
	_ = ensureIDType(db, "g_code")

	if studentTypeID == 0 || teacherTypeID == 0 || adminTypeID == 0 || idTypeID == 0 {
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

	// 2. Create Users (2 per role: 1 Thai, 1 Foreigner)
	users := []entity.User{
		// --- Student ---
		{
			// Thai Student (No English Name)
			FirstNameTH:   "สมชาย",
			LastNameTH:    "รักเรียน",
			Email:         "student_th@example.com",
			Password:      "password123",
			IDNumber:      "1100000000001",
			Phone:         "0810000001",
			Birthday:      parseDate("01-01-2003"),
			PDPAConsent:   true,
			AccountTypeID: studentTypeID,
			IDDocTypeID:   idTypeID,
		},
		{
			// Foreign Student (No Thai Name)
			FirstNameEN:   "John",
			LastNameEN:    "Doe",
			Email:         "student_en@example.com",
			Password:      "password123",
			IDNumber:      "1100000000002",
			Phone:         "0810000002",
			Birthday:      parseDate("02-02-2003"),
			PDPAConsent:   true,
			AccountTypeID: studentTypeID,
			IDDocTypeID:   idTypeID,
		},

		// --- Teacher ---
		{
			// Thai Teacher (No English Name)
			FirstNameTH:   "สมศรี",
			LastNameTH:    "สอนดี",
			Email:         "teacher_th@example.com",
			Password:      "password123",
			IDNumber:      "2100000000001",
			Phone:         "0820000001",
			Birthday:      parseDate("10-05-1980"),
			PDPAConsent:   true,
			AccountTypeID: teacherTypeID,
			IDDocTypeID:   idTypeID,
		},
		{
			// Foreign Teacher (No Thai Name)
			FirstNameEN:   "Robert",
			LastNameEN:    "Smith",
			Email:         "teacher_en@example.com",
			Password:      "password123",
			IDNumber:      "2100000000002",
			Phone:         "0820000002",
			Birthday:      parseDate("15-08-1982"),
			PDPAConsent:   true,
			AccountTypeID: teacherTypeID,
			IDDocTypeID:   idTypeID,
		},

		// --- Admin ---
		{
			// Thai Admin (No English Name)
			FirstNameTH:   "สมศักดิ์",
			LastNameTH:    "ดูแล",
			Email:         "admin_th@example.com",
			Password:      "password123",
			IDNumber:      "3100000000001",
			Phone:         "0830000001",
			Birthday:      parseDate("01-01-1990"),
			PDPAConsent:   true,
			AccountTypeID: adminTypeID,
			IDDocTypeID:   idTypeID,
		},
		{
			// Foreign Admin (No Thai Name)
			FirstNameEN:   "Alice",
			LastNameEN:    "Wonder",
			Email:         "admin_en@example.com",
			Password:      "password123",
			IDNumber:      "3100000000002",
			Phone:         "0830000002",
			Birthday:      parseDate("12-12-1992"),
			PDPAConsent:   true,
			AccountTypeID: adminTypeID,
			IDDocTypeID:   idTypeID,
		},
	}

	for _, user := range users {
		// Hash password
		hashed, err := config.HashPassword(user.Password)
		if err != nil {
			log.Printf("skip user %s, hash error: %v\n", user.Email, err)
			continue
		}
		user.Password = hashed

		// Set consent date if consented
		if user.PDPAConsent {
			now := time.Now()
			user.PDPAConsentAt = &now
			user.ProfileCompleted = true
		}

		// Create User if not exists
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
