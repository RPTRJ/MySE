package seed

import (
	"errors"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// SeedEducationData populates reference tables for education levels and curriculum types.
func SeedEducationData() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedEducationData skipped: DB is nil")
		return
	}

	seedEducationLevels(db)
	seedSchoolTypes(db)
	seedSchools(db)
	seedCurriculumTypes(db)
}

func seedEducationLevels(db *gorm.DB) {
	var count int64
	if err := db.Model(&entity.EducationLevel{}).Count(&count).Error; err != nil {
		log.Println("count education levels error:", err)
		return
	}
	if count > 0 {
		log.Println("education levels already seeded")
		return
	}

	levels := []string{
		"มัธยมศึกษาตอนปลาย",
		"ประกาศนียบัตรวิชาชีพ (ปวช.)",
		"ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
		"GED",
	}

	for _, name := range levels {
		if err := db.Create(&entity.EducationLevel{Name: name}).Error; err != nil {
			log.Println("seed education level error:", err)
			return
		}
	}
	log.Println("seed education levels completed")
}

func seedSchoolTypes(db *gorm.DB) {
	types := []string{
		"โรงเรียนทั่วไป",
		"โรงเรียนนานาชาติ / อินเตอร์",
	}

	for _, name := range types {
		var schoolType entity.SchoolType
		if err := db.Where("name = ?", name).First(&schoolType).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := db.Create(&entity.SchoolType{Name: name}).Error; err != nil {
					log.Println("seed school type error:", err)
					return
				}
				log.Printf("seeded school type: %s\n", name)
			} else {
				log.Println("seed school type query error:", err)
				return
			}
		} else {
			log.Printf("school type already present: %s\n", name)
		}
	}
	log.Println("seed school types completed (idempotent)")
}

func seedSchools(db *gorm.DB) {
	// Map school name to type and project flag
	type schoolSeed struct {
		Name           string
		TypeName       string
		IsProjectBased bool
	}

	var schoolTypes []entity.SchoolType
	if err := db.Find(&schoolTypes).Error; err != nil {
		log.Println("cannot load school types:", err)
		return
	}
	typeIDByName := map[string]uint{}
	for _, t := range schoolTypes {
		typeIDByName[t.Name] = t.ID
	}

	schools := []schoolSeed{
		{Name: "โรงเรียนเตรียมอุดมศึกษา", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนสวนกุหลาบวิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนมหิดลวิทยานุสรณ์", TypeName: "โรงเรียนทั่วไป", IsProjectBased: true},
		{Name: "Bangkok Patana School", TypeName: "โรงเรียนนานาชาติ / อินเตอร์", IsProjectBased: true},
		{Name: "Harrow International School Bangkok", TypeName: "โรงเรียนนานาชาติ / อินเตอร์", IsProjectBased: true},
		{Name: "โรงเรียนกรุงเทพคริสเตียนวิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนสตรีวิทยา", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนสามเสนวิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนโยธินบูรณะ", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนเตรียมอุดมศึกษาน้อมเกล้า", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนบดินทรเดชา (สิงห์ สิงหเสนี)", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย ฝ่ายมัธยม", TypeName: "โรงเรียนทั่วไป", IsProjectBased: true},
		{Name: "โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (มัธยม)", TypeName: "โรงเรียนทั่วไป", IsProjectBased: true},
		{Name: "โรงเรียนสาธิตมหาวิทยาลัยเกษตรศาสตร์", TypeName: "โรงเรียนทั่วไป", IsProjectBased: true},
		{Name: "โรงเรียนสวนกุหลาบวิทยาลัย นนทบุรี", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนหอวัง", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนเทพศิรินทร์", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนเซนต์คาเบรียล", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนอัสสัมชัญ", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนราชินี", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนสตรีราชินูทิศ", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนเบญจมราชาลัยในพระบรมราชูปถัมภ์", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนยุพราชวิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนปรินส์รอยแยลส์วิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนหาดใหญ่วิทยาลัย", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
		{Name: "โรงเรียนขอนแก่นวิทยายน", TypeName: "โรงเรียนทั่วไป", IsProjectBased: false},
	}

	for _, s := range schools {
		typeID := typeIDByName[s.TypeName]
		if typeID == 0 {
			log.Printf("skip school %s: missing type %s\n", s.Name, s.TypeName)
			continue
		}
		var school entity.School
		if err := db.Where("name = ?", s.Name).First(&school).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				school = entity.School{
					Name:           s.Name,
					SchoolTypeID:   typeID,
					IsProjectBased: s.IsProjectBased,
				}
				if err := db.Create(&school).Error; err != nil {
					log.Println("seed school error:", err)
					return
				}
				log.Printf("seeded school: %s\n", s.Name)
			} else {
				log.Println("seed school query error:", err)
				return
			}
		} else {
			log.Printf("school already present: %s\n", s.Name)
		}
	}
	log.Println("seed schools completed (idempotent)")
}

func seedCurriculumTypes(db *gorm.DB) {
	types := []string{
		"สายวิทย์-คณิต",
		"สายศิลป์-คำนวณ",
		"สายศิลป์-ภาษา",
		"สายอาชีวะ / Vocational",
		"GED",
	}

	for _, name := range types {
		var curType entity.CurriculumType
		if err := db.Where("name = ?", name).First(&curType).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := db.Create(&entity.CurriculumType{Name: name}).Error; err != nil {
					log.Println("seed curriculum type error:", err)
					return
				}
				log.Printf("seeded curriculum type: %s\n", name)
			} else {
				log.Println("seed curriculum type query error:", err)
				return
			}
		} else {
			log.Printf("curriculum type already present: %s\n", name)
		}
	}
	log.Println("seed curriculum types completed (idempotent)")
}
