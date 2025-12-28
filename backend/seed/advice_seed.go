package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// SeedAdvice inserts sample skills, courses, and advice linkages for the teacher advice feature.
func SeedAdvice() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedAdvice ERROR: DB is nil")
		return
	}

	skillIDs := seedAdviceSkills(db)
	courseIDs := seedAdviceCourses(db)

	if skipIfSeededDefault(db, &entity.Advice{}, "advices") {
		return
	}

	advices := []entity.Advice{
		{
			ProgramCode:   "CPE-ADVICE",
			ProgramNameTH: "คำแนะนำหลักสูตรวิศวกรรมคอมพิวเตอร์",
			ProgramNameEN: "Computer Engineering Advice",
			Description:   "ตัวอย่างคำแนะนำที่เชื่อมรายวิชากับทักษะที่ควรมี",
			IconURL:       "https://placehold.co/96x96/orange/white?text=CPE",
			DurationYears: 4,
			TotalCredits:  150,
			IsActive:      true,
		},
	}

	if err := db.Create(&advices).Error; err != nil {
		log.Println("seed advice error:", err)
		return
	}

	// Link advice to courses and skills
	for _, adv := range advices {
		ac := []entity.AdviceCourse{
			{AdviceID: adv.ID, CourseID: courseIDs["CS101"], Semester: 1, Year: 1, IsRequired: true},
			{AdviceID: adv.ID, CourseID: courseIDs["CS201"], Semester: 1, Year: 2, IsRequired: true},
			{AdviceID: adv.ID, CourseID: courseIDs["CS310"], Semester: 1, Year: 3, IsRequired: false},
		}
		as := []entity.AdviceSkill{
			{AdviceID: adv.ID, SkillID: skillIDs["design"], Description: "ใช้กับการวางแผนโปรเจ็กต์"},
			{AdviceID: adv.ID, SkillID: skillIDs["coding"], Description: "พื้นฐานการพัฒนาซอฟต์แวร์"},
			{AdviceID: adv.ID, SkillID: skillIDs["presentation"], Description: "การสื่อสารผลงาน"},
		}

		if err := db.Create(&ac).Error; err != nil {
			log.Println("seed advice courses error:", err)
		}
		if err := db.Create(&as).Error; err != nil {
			log.Println("seed advice skills error:", err)
		}
	}

	log.Println("Seed advice completed")
}

func seedAdviceSkills(db *gorm.DB) map[string]uint {
	if skipIfSeededDefault(db, &entity.Skill{}, "skills") {
		// Fetch existing ones to keep linkage working
		return fetchSkillIDs(db)
	}

	skills := []entity.Skill{
		{SkillNameTH: "การคิดเชิงออกแบบ", SkillNameEN: "Design Thinking", Category: 1, Description: "ทักษะการออกแบบและแก้ปัญหา"},
		{SkillNameTH: "การพัฒนาโปรแกรม", SkillNameEN: "Software Development", Category: 2, Description: "พื้นฐานการเขียนโค้ดและโครงสร้างข้อมูล"},
		{SkillNameTH: "การนำเสนอ", SkillNameEN: "Presentation", Category: 3, Description: "สื่อสารผลงานและทำงานเป็นทีม"},
	}

	if err := db.Create(&skills).Error; err != nil {
		log.Println("seed skills error:", err)
		return map[string]uint{}
	}

	return map[string]uint{
		"design":       skills[0].ID,
		"coding":       skills[1].ID,
		"presentation": skills[2].ID,
	}
}

func seedAdviceCourses(db *gorm.DB) map[string]uint {
	if skipIfSeededDefault(db, &entity.Course{}, "courses") {
		return fetchCourseIDs(db)
	}

	courses := []entity.Course{
		{CourseCode: "CS101", CourseNameTH: "โปรแกรมมิ่งพื้นฐาน", CourseNameEN: "Intro to Programming", Credits: 3, Category: 1, Description: "พื้นฐานการเขียนโปรแกรมและตรรกะ"},
		{CourseCode: "CS201", CourseNameTH: "โครงสร้างข้อมูล", CourseNameEN: "Data Structures", Credits: 3, Category: 2, Description: "โครงสร้างข้อมูลและอัลกอริทึมเบื้องต้น"},
		{CourseCode: "CS310", CourseNameTH: "โครงงานซอฟต์แวร์", CourseNameEN: "Software Project", Credits: 3, Category: 3, Description: "พัฒนาโครงงานจริงและการทำงานเป็นทีม"},
	}

	if err := db.Create(&courses).Error; err != nil {
		log.Println("seed courses error:", err)
		return map[string]uint{}
	}

	return map[string]uint{
		"CS101": courses[0].ID,
		"CS201": courses[1].ID,
		"CS310": courses[2].ID,
	}
}

func fetchSkillIDs(db *gorm.DB) map[string]uint {
	var skills []entity.Skill
	db.Where("skill_name_en IN ?", []string{"Design Thinking", "Software Development", "Presentation"}).Find(&skills)
	result := map[string]uint{}
	for _, s := range skills {
		switch s.SkillNameEN {
		case "Design Thinking":
			result["design"] = s.ID
		case "Software Development":
			result["coding"] = s.ID
		case "Presentation":
			result["presentation"] = s.ID
		}
	}
	return result
}

func fetchCourseIDs(db *gorm.DB) map[string]uint {
	var courses []entity.Course
	db.Where("course_code IN ?", []string{"CS101", "CS201", "CS310"}).Find(&courses)
	result := map[string]uint{}
	for _, c := range courses {
		result[c.CourseCode] = c.ID
	}
	return result
}
