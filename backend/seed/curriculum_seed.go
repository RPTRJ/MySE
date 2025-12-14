package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

func CurriculumSeed() {
	db := config.GetDB()

	if db == nil {
		log.Println("CurriculumSeed ERROR: DB is nil")
		return
	}

	seedFaculties(db)
	seedPrograms(db)
}

func seedFaculties(db *gorm.DB) {
	var count int64
	if err := db.Model(&entity.Faculty{}).Count(&count).Error; err != nil {
		log.Println("count faculties error:", err)
		return
	}

	if count > 0 {
		log.Println("faculties already seeded")
		return
	}

	facs := []entity.Faculty{
		{
			Name:      "สำนักวิชาวิศวกรรมศาสตร์",
			ShortName: "ENG",
		},
		{
			Name:      "สำนักวิชาวิทยาศาสตร์",
			ShortName: "SCI",
		},
	}

	if err := db.Create(&facs).Error; err != nil {
		log.Println("seed faculties error:", err)
		return
	}

	log.Println("seed faculties completed")
}

func seedPrograms(db *gorm.DB) {
	var count int64
	if err := db.Model(&entity.Program{}).Count(&count).Error; err != nil {
		log.Println("count programs error:", err)
		return
	}

	if count > 0 {
		log.Println("programs already seeded")
		return
	}

	var eng entity.Faculty
	if err := db.Where("short_name = ?", "ENG").First(&eng).Error; err != nil {
		log.Println("cannot find ENG faculty:", err)
		return
	}

	progs := []entity.Program{
		{
			Name:      "วิศวกรรมคอมพิวเตอร์",
			ShortName: "CPE",
			FacultyID: eng.ID,
		},
		{
			Name:      "วิศวกรรมไฟฟ้า",
			ShortName: "EEE",
			FacultyID: eng.ID,
		},
		{
			Name:      "วิศวกรรมเครื่องกล",
			ShortName: "ME",
			FacultyID: eng.ID,
		},
	}

	if err := db.Create(&progs).Error; err != nil {
		log.Println("seed programs error:", err)
		return
	}

	log.Println("seed programs completed")
}
